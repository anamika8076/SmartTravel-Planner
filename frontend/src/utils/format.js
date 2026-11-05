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
 * Date-times are shown and edited exactly as the backend sends them
 * ("2026-12-15T08:00:00"), without converting time zones, so the value a
 * user enters is the value they see again.
 */
export function toDateTimeInput(value) {
  return value ? String(value).slice(0, 16) : '';
}

export function formatDateTime(value) {
  if (!value) return '—';
  const [date, time = ''] = String(value).split('T');
  return `${formatDate(date, { withYear: false })}, ${time.slice(0, 5)}`;
}

function naiveDateTime(value) {
  if (!value) return null;
  const [date, time = '00:00'] = String(value).split('T');
  const d = parseDate(date);
  if (!d) return null;
  const [h, min] = time.split(':').map(Number);
  d.setHours(h || 0, min || 0);
  return d;
}

/** Minutes between two backend date-times, or null. */
export function minutesBetween(start, end) {
  const s = naiveDateTime(start);
  const e = naiveDateTime(end);
  if (!s || !e) return null;
  return Math.round((e - s) / 60_000);
}

export function formatDuration(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} hr ${rest} min` : `${h} hr`;
}
