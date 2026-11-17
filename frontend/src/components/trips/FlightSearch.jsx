import React, { useState } from 'react';
import { ArrowRight, Check, ExternalLink, Plane, PlaneTakeoff, Search, Users } from 'lucide-react';
import { TextField } from '../ui/Field';
import { Alert, Badge } from '../ui/Feedback';
import { ListSkeleton } from '../ui/Skeleton';
import Button from '../ui/Button';
import { flightsApi } from '../../api/endpoints';
import { airportCodeFor } from '../../constants/airports';
import { formatDuration, formatINR, minutesBetween, splitDateTime, todayISO } from '../../utils/format';

/**
 * The flight provider gives local airport times without a time zone
 * ("2027-01-01T07:10:00"). Django would read those as UTC and shift them by
 * 5½ hours, so we attach India's offset (+05:30) when none is present.
 */
function withAirportOffset(value) {
  if (!value) return '';
  const v = String(value);
  return /(Z|[+-]\d{2}:?\d{2})$/.test(v) ? v : `${v.length === 16 ? `${v}:00` : v}+05:30`;
}

/** Turn one provider offer into the fields we display and save. */
function normalizeOffer(offer, index) {
  const outbound = offer?.outbound || {};
  const segments = outbound.segments || [];
  const first = segments[0] || {};
  const last = segments[segments.length - 1] || {};
  const durationSeconds =
    outbound.duration_seconds || outbound.total_duration_seconds || null;
  return {
    key: offer?.id || `${first.flight_no || 'offer'}-${index}`,
    airline: first.airline_name || offer?.owner_airline || 'Airline',
    flightNo: first.flight_no || '',
    origin: first.origin || '',
    destination: last.destination || '',
    departure: withAirportOffset(first.departure),
    arrival: withAirportOffset(last.arrival),
    stops: Number(outbound.stopovers ?? Math.max(segments.length - 1, 0)) || 0,
    minutes: durationSeconds ? Math.round(durationSeconds / 60) : minutesBetween(withAirportOffset(first.departure), withAirportOffset(last.arrival)),
    price: Number(offer?.price),
    currency: String(offer?.currency || '').toUpperCase(),
    bookingUrl: offer?.booking_url || '',
    seats: offer?.availability_seats ?? null,
    usable: segments.length > 0 && first.departure && last.arrival,
  };
}

function formatPrice(offer) {
  if (!Number.isFinite(offer.price)) return 'Price unavailable';
  if (offer.currency === 'INR' || !offer.currency) return formatINR(offer.price);
  return `${offer.currency} ${offer.price.toLocaleString('en-IN')}`;
}

/** "6E 2164" / "6E2164" → "6E2164" so saved and searched flights compare equal. */
const flightCode = (v) => String(v || '').replace(/\s+/g, '').toUpperCase();

/** Same flight number on the same day (tolerates small time differences). */
function isAlreadySaved(offer, savedOptions) {
  const code = flightCode(offer.flightNo);
  const day = String(offer.departure).slice(0, 10);
  return savedOptions.some((t) => {
    if (t.transport_type !== 'flight') return false;
    const sameFlight = code && flightCode(t.provider).includes(code);
    const sameTime = new Date(t.departure_time).getTime() === new Date(offer.departure).getTime();
    const sameDay = new Date(t.departure_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === day;
    return (sameFlight && (sameTime || sameDay)) || (sameTime && Number(t.estimated_cost) === offer.price);
  });
}

export default function FlightSearch({ trip, onSave, onDone, savedOptions = [] }) {
  const [form, setForm] = useState({
    origin: airportCodeFor(trip.source),
    destination: airportCodeFor(trip.destination),
    date_from: trip.start_date >= todayISO() ? trip.start_date : todayISO(),
    adults: String(Math.min(Math.max(Number(trip.number_of_people) || 1, 1), 9)),
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState(null);
  const [saving, setSaving] = useState('');
  const [saved, setSaved] = useState({});

  const set = (field) => (e) => {
    const value = field === 'origin' || field === 'destination' ? e.target.value.toUpperCase().slice(0, 3) : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!/^[A-Z]{3}$/.test(form.origin)) e.origin = '3-letter code, e.g. DEL';
    if (!/^[A-Z]{3}$/.test(form.destination)) e.destination = '3-letter code, e.g. BOM';
    if (!e.origin && form.origin === form.destination) e.destination = 'Must differ from origin';
    if (!form.date_from || form.date_from < todayISO()) e.date_from = 'Today or later';
    const n = Number(form.adults);
    if (!Number.isInteger(n) || n < 1 || n > 9) e.adults = '1 to 9';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const search = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    setOffers(null);
    try {
      const data = await flightsApi.search({ ...form, adults: Number(form.adults) });
      const list = (Array.isArray(data?.offers) ? data.offers : Array.isArray(data) ? data : [])
        .map(normalizeOffer)
        .filter((o) => o.usable)
        .filter((o, i, all) => all.findIndex((x) => x.flightNo === o.flightNo && x.departure === o.departure && x.price === o.price) === i);
      setOffers(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const save = async (offer) => {
    setSaving(offer.key);
    setError('');
    try {
      await onSave({
        trip: trip.id,
        transport_type: 'flight',
        origin: offer.origin || form.origin,
        destination: offer.destination || form.destination,
        departure_time: offer.departure,
        arrival_time: offer.arrival,
        estimated_cost: offer.price.toFixed(2),
        provider: [offer.airline, offer.flightNo].filter(Boolean).join(' '),
        booking_url: offer.bookingUrl,
      });
      setSaved((s) => ({ ...s, [offer.key]: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={search} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField id="fs-origin" label="From (airport)" icon={PlaneTakeoff} placeholder="DEL" value={form.origin} onChange={set('origin')} error={errors.origin} autoComplete="off" />
          <TextField id="fs-destination" label="To (airport)" icon={Plane} placeholder="BOM" value={form.destination} onChange={set('destination')} error={errors.destination} autoComplete="off" />
          <TextField id="fs-date" label="Date" type="date" min={todayISO()} value={form.date_from} onChange={set('date_from')} error={errors.date_from} />
          <TextField id="fs-adults" label="Adults" type="number" min="1" max="9" icon={Users} value={form.adults} onChange={set('adults')} error={errors.adults} />
        </div>
        <Button type="submit" icon={Search} loading={loading} className="w-full">
          Search flights
        </Button>
      </form>

      <Alert>{error}</Alert>

      {loading && <ListSkeleton rows={3} />}

      {offers && !loading && (
        offers.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            No flights found for this route and date. Try another date, or add an option manually.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              {offers.length} offer{offers.length === 1 ? '' : 's'}, cheapest first. Prices are live quotes and can change.
            </p>
            <ul className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 -mr-1">
              {offers.map((o) => {
                const dep = splitDateTime(o.departure);
                const arr = splitDateTime(o.arrival);
                const canSave = o.currency === 'INR' && Number.isFinite(o.price);
                return (
                  <li key={o.key} className="rounded-2xl ring-1 ring-slate-200 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {o.airline} {o.flightNo && <span className="text-slate-400 font-normal">· {o.flightNo}</span>}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600 tabular-nums">
                          <span>{dep.time}</span>
                          <span className="text-slate-400">{o.origin}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                          <span>{arr.time}</span>
                          <span className="text-slate-400">{o.destination}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {dep.date} · {formatDuration(o.minutes)} · {o.stops === 0 ? 'Non-stop' : `${o.stops} stop${o.stops > 1 ? 's' : ''}`}
                          {o.seats != null && ` · ${o.seats} seats left`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1.5">
                        <p className="font-bold text-slate-900 tabular-nums">{formatPrice(o)}</p>
                        {saved[o.key] || isAlreadySaved(o, savedOptions) ? (
                          <Badge tone="emerald"><Check className="w-3 h-3" /> Saved</Badge>
                        ) : (
                          <Button size="sm" onClick={() => save(o)} loading={saving === o.key} disabled={!canSave || !!saving} title={canSave ? 'Save to this trip' : 'Only INR prices can be saved'}>
                            Save
                          </Button>
                        )}
                      </div>
                    </div>
                    {o.bookingUrl && (
                      <a href={o.bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline">
                        Book on provider site <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )
      )}

      <div className="flex justify-end pt-1">
        <Button variant="secondary" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
