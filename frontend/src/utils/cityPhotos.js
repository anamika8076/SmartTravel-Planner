// Finds a real photo of a specific city from its Wikipedia article.
// "City, State" is tried first so we get the right place (e.g. Vasco da Gama,
// Goa — not the explorer), and a result is only accepted if the article is
// about a place in India. Results are cached in memory and localStorage.

import { destinationsApi } from '../api/endpoints';

const API = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const STORE_KEY = 'stp.cityPhotos.v2';
// Wikimedia only serves these thumbnail widths; others return an error.
const WIDTHS = [330, 500, 960, 1280, 1920];
const memory = new Map(); // key -> url | null
const inflight = new Map(); // key -> Promise

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(key, value) {
  try {
    const all = readStore();
    all[key] = value;
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — memory cache still works */
  }
}

const norm = (v) => String(v || '').trim().replace(/\s+/g, ' ');

/** Resize a Wikimedia thumbnail URL ("…/330px-Name.jpg") to the given width. */
function resized(summary, width) {
  const thumb = summary?.thumbnail?.source;
  const original = summary?.originalimage;
  if (!thumb) return original?.source || null;
  const wanted = WIDTHS.find((w) => w >= width) || WIDTHS[WIDTHS.length - 1];
  // Never ask for more than the original; use the original file if it's smaller.
  if (original?.width && wanted >= original.width) return original.source;
  return thumb.replace(/\/\d+px-/, `/${wanted}px-`);
}

async function fetchSummary(title) {
  const res = await fetch(API + encodeURIComponent(title.replace(/ /g, '_')), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

function looksRight(summary, state) {
  if (!summary || summary.type !== 'standard' || !summary.thumbnail) return false;
  const text = `${summary.description || ''} ${summary.extract || ''}`.toLowerCase();
  if (!text.includes('india') && !(state && text.includes(state.toLowerCase()))) return false;
  // Skip people, films, ships etc. that share a place name.
  return !/\b(explorer|navigator|film|novel|album|footballer|actor|ship|born)\b/.test(String(summary.description || '').toLowerCase());
}

/* Destination name → state, from the saved destinations (fetched once). */
let statesPromise = null;
function stateFor(name) {
  if (!statesPromise) {
    statesPromise = destinationsApi
      .list()
      .then((list) => new Map(list.map((d) => [norm(d.name).toLowerCase(), norm(d.state)])))
      .catch(() => new Map());
  }
  return statesPromise.then((map) => map.get(norm(name).toLowerCase()) || '');
}

/** Promise<string|null>: photo URL for the city, or null if none is found. */
export async function findCityPhoto(name, state = '', width = 1200) {
  const city = norm(name);
  if (!city) return null;
  const st = norm(state) || (await stateFor(city));
  const key = `${city.toLowerCase()}|${st.toLowerCase()}|${width}`;

  if (memory.has(key)) return memory.get(key);
  const stored = readStore()[key];
  if (stored !== undefined) {
    memory.set(key, stored);
    return stored;
  }
  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    // Wikipedia titles keep small words lowercase ("Vasco da Gama"), so try both.
    const small = city.replace(/\b(Da|De|Di|Of|And|The|Ka|Ki|Ke)\b/g, (w) => w.toLowerCase());
    const names = [...new Set([city, small])];
    const titles = [
      // "Goa, Goa" never exists, so skip it when the city is the state.
      ...names.map((n) => st && n.toLowerCase() !== st.toLowerCase() && `${n}, ${st}`),
      ...names.map((n) => `${n}, India`),
      ...names,
    ].filter(Boolean);
    for (const title of titles) {
      try {
        const summary = await fetchSummary(title);
        if (looksRight(summary, st)) return resized(summary, width);
      } catch {
        /* network error — try the next title */
      }
    }
    return null;
  })().then((url) => {
    memory.set(key, url);
    writeStore(key, url);
    inflight.delete(key);
    return url;
  });

  inflight.set(key, job);
  return job;
}
