const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(value) {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(n)) return '—';
  return inr.format(n);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses "YYYY-MM-DD" as a local calendar date (no timezone shift). */
export function parseDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatDate(value, { withYear = true } = {}) {
  const date = parseDate(value);
  if (!date) return '—';
  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return withYear ? `${base} ${date.getFullYear()}` : base;
}

export function formatDateRange(start, end) {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return '—';
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${formatDate(start, { withYear: !sameYear })} – ${formatDate(end)}`;
}

/** Number of nights between two dates (end exclusive). */
export function nightsBetween(start, end) {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return 0;
  return Math.max(0, Math.round((e - s) / 86_400_000));
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function tripStatus(start, end) {
  const today = todayISO();
  if (end && end < today) return 'completed';
  if (start && start <= today) return 'ongoing';
  return 'upcoming';
}

/*
 * Date-times: the backend stores them in UTC and returns ISO strings with an
 * offset ("2026-12-15T02:30:00Z"). We show and edit them in the browser's
 * local time and send them back with the local offset.
 */
const pad2 = (n) => String(n).padStart(2, '0');

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Backend date-time → value for <input type="datetime-local"> (local time). */
export function toDateTimeInput(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → ISO 8601 with the local offset. */
export function fromDateTimeInput(local) {
  const d = toDate(local);
  if (!d) return local;
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  return `${local.length === 16 ? `${local}:00` : local}${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

/** "15 Dec, 08:00" in local time. */
export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** { date: "15 Dec", time: "08:00" } in local time. */
export function splitDateTime(value) {
  const d = toDate(value);
  if (!d) return { date: '—', time: '—' };
  return { date: `${d.getDate()} ${MONTHS[d.getMonth()]}`, time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}` };
}

/** Minutes between two date-times, or null. */
export function minutesBetween(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return null;
  return Math.round((e - s) / 60_000);
}

/** "09:00:00" → "09:00" */
export function formatClock(value) {
  return value ? String(value).slice(0, 5) : '—';
}

export function formatDuration(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} hr ${rest} min` : `${h} hr`;
}

/** Whole days from today until the given date (negative if in the past). */
export function daysUntil(value) {
  const d = parseDate(value);
  const t = parseDate(todayISO());
  if (!d || !t) return null;
  return Math.round((d - t) / 86_400_000);
}

/** Human countdown for a trip, e.g. "Starts in 12 days", "Day 2 of 6". */
export function tripCountdown(start, end) {
  const status = tripStatus(start, end);
  if (status === 'completed') {
    const ago = -daysUntil(end);
    return ago <= 1 ? 'Ended yesterday' : ago < 30 ? `Ended ${ago} days ago` : 'Completed';
  }
  if (status === 'ongoing') {
    const day = -daysUntil(start) + 1;
    return `Day ${day} of ${nightsBetween(start, end) + 1}`;
  }
  const n = daysUntil(start);
  if (n === 0) return 'Starts today';
  if (n === 1) return 'Starts tomorrow';
  return `Starts in ${n} days`;
}

const SMALL_WORDS = new Set(['and', 'of', 'the', 'on', 'in']);

/** "new delhi" → "New Delhi", "jammu and kashmir" → "Jammu and Kashmir". */
export function titleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word)
        ? word
        : word.replace(/(^|[-'(])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase())
    )
    .join(' ');
}

const CITY_ALIASES = { bangalore: 'bengaluru', banglore: 'bengaluru' };

/** Lower-case canonical city key, so "Bangalore" and "Bengaluru" match. */
export function cityKey(name) {
  const key = String(name ?? '').trim().toLowerCase();
  return CITY_ALIASES[key] || key;
}
