// Thin fetch wrapper around the Django REST backend.
// - Attaches the JWT access token to authenticated requests
// - Transparently refreshes the access token once on a 401
// - Normalises DRF error payloads into ApiError

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const KEYS = {
  access: 'stp.access',
  refresh: 'stp.refresh',
  username: 'stp.username',
};

/* ------------------------------------------------------------------ */
/* Session storage (localStorage when "remember me", else sessionStorage) */
/* ------------------------------------------------------------------ */

function read(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function activeStorage() {
  return localStorage.getItem(KEYS.refresh) ? localStorage : sessionStorage;
}

export function getSession() {
  const refresh = read(KEYS.refresh);
  if (!refresh) return null;
  return { username: read(KEYS.username) || '' };
}

export function saveSession({ access, refresh, username }, remember) {
  clearSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(KEYS.access, access);
  store.setItem(KEYS.refresh, refresh);
  store.setItem(KEYS.username, username);
}

function updateTokens({ access, refresh }) {
  const store = activeStorage();
  if (access) store.setItem(KEYS.access, access);
  // Simple JWT returns a new refresh token when ROTATE_REFRESH_TOKENS is on.
  if (refresh) store.setItem(KEYS.refresh, refresh);
}

export function clearSession() {
  for (const store of [localStorage, sessionStorage]) {
    Object.values(KEYS).forEach((k) => store.removeItem(k));
  }
}

let sessionExpiredHandler = null;
export function onSessionExpired(handler) {
  sessionExpiredHandler = handler;
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

function toText(value) {
  if (Array.isArray(value)) return value.map(toText).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(toText).join(' ');
  return String(value ?? '');
}

export class ApiError extends Error {
  constructor(status, data) {
    super('');
    this.status = status;
    this.data = data;
    this.fieldErrors = {};

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const [key, value] of Object.entries(data)) {
        if (key !== 'detail' && key !== 'non_field_errors') {
          this.fieldErrors[key] = toText(value);
        }
      }
    }

    this.message = ApiError.describe(status, data, this.fieldErrors);
  }

  static describe(status, data, fieldErrors) {
    if (data?.detail) return toText(data.detail);
    if (data?.non_field_errors) return toText(data.non_field_errors);
    if (status === 0) return 'Could not reach the server. Make sure the backend is running.';
    if (status === 400) {
      const lines = Object.entries(fieldErrors).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
      return lines.length ? lines.join(' • ') : 'Please check the details you entered.';
    }
    if (status === 401) return 'Your session has expired. Please log in again.';
    if (status === 403) return 'You do not have permission to do that.';
    if (status === 404) return 'We could not find what you were looking for.';
    if (status >= 500) return 'The server ran into a problem. Please try again later.';
    return `Request failed (${status}).`;
  }
}

/**
 * Splits an error into inline field errors (for fields the form shows)
 * and a top-level message for everything else.
 */
export function splitFormErrors(err, knownFields) {
  if (!(err instanceof ApiError)) {
    return { fieldErrors: {}, formError: err?.message || 'Something went wrong.' };
  }
  const fieldErrors = {};
  const leftovers = {};
  for (const [key, msg] of Object.entries(err.fieldErrors)) {
    if (knownFields.includes(key)) fieldErrors[key] = msg;
    else leftovers[key] = msg;
  }
  const hasLeftovers = Object.keys(leftovers).length > 0;
  let formError = '';
  if (err.status !== 400 || err.data?.detail || err.data?.non_field_errors) {
    formError = err.message;
  } else if (hasLeftovers) {
    formError = ApiError.describe(400, null, leftovers);
  } else if (!Object.keys(fieldErrors).length) {
    formError = err.message;
  }
  return { fieldErrors, formError };
}

/* ------------------------------------------------------------------ */
/* Requests                                                            */
/* ------------------------------------------------------------------ */

function toUrl(path) {
  return `${BASE_URL}${path}`;
}

async function parseBody(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null; // e.g. an HTML error page from Django
  }
}

let refreshInFlight = null;

function refreshAccessToken() {
  const refresh = read(KEYS.refresh);
  if (!refresh) return Promise.resolve(null);

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(toUrl('/api/token/refresh/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        updateTokens(data);
        return data.access;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function request(path, { method = 'GET', body, auth = false } = {}, isRetry = false) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const access = read(KEYS.access);
  if (auth && access) headers.Authorization = `Bearer ${access}`;

  let res;
  try {
    res = await fetch(toUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, null);
  }

  if (res.status === 401 && auth && !isRetry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) return request(path, { method, body, auth }, true);
    clearSession();
    sessionExpiredHandler?.();
  }

  const data = await parseBody(res);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/**
 * GET a list endpoint. Works whether or not DRF pagination is enabled,
 * and follows `next` links so the caller always gets the full list.
 */
export async function requestList(path, options = {}) {
  const items = [];
  let next = path;
  while (next) {
    const data = await request(next, options);
    if (Array.isArray(data)) return data;
    items.push(...(data?.results ?? []));
    next = data?.next ? toRelative(data.next) : null;
  }
  return items;
}

function toRelative(url) {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}
