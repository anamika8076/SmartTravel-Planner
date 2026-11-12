import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Clock,
  Coffee,
  ExternalLink,
  Footprints,
  HelpCircle,
  MapPin,
  RefreshCw,
  Route,
  Sparkles,
  UtensilsCrossed,
  Wand2,
} from 'lucide-react';
import Button from '../ui/Button';
import { Alert, Badge, Card } from '../ui/Feedback';
import { Skeleton } from '../ui/Skeleton';
import HotelPicker from './HotelPicker';
import { plannerApi } from '../../api/endpoints';
import { ACCOMMODATION_TYPES, TRANSPORT_TYPES, labelFor, prettify } from '../../constants/options';
import { placeMeta } from '../destinations/placeMeta';
import {
  formatClock,
  formatDate,
  formatDateTime,
  formatDuration,
  formatINR,
  nightsBetween,
  parseDate,
} from '../../utils/format';

/* ------------------------------------------------------------------ */
/* Cache the full generate response: GET latest only returns itinerary */
/* items, so reopening a trip would otherwise lose costs & choices.    */
/* ------------------------------------------------------------------ */

const cacheKey = (tripId) => `stp.plan.${tripId}`;

function readCache(tripId) {
  try {
    const raw = localStorage.getItem(cacheKey(tripId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(tripId, data) {
  try {
    localStorage.setItem(cacheKey(tripId), JSON.stringify({ savedAt: new Date().toISOString(), data }));
  } catch {
    /* storage full or blocked — the plan still shows for this visit */
  }
}

/* ------------------------------------------------------------------ */
/* Normalise the two itinerary shapes into one                          */
/* ------------------------------------------------------------------ */

function fromGenerate(items = []) {
  return items.map((i) => ({
    key: `${i.day}-${i.order}-${i.id}`,
    day: i.day,
    order: i.order,
    name: i.place,
    category: i.category,
    start: i.start_time,
    end: i.end_time,
    lat: i.latitude,
    lng: i.longitude,
    visitMinutes: i.visit_minutes,
    travelMinutes: i.travel_minutes_before,
    distanceKm: i.distance_before_km,
  }));
}

function fromLatest(items = []) {
  return items.map((i) => ({
    key: `${i.day}-${i.order}-${i.id}`,
    day: i.day,
    order: i.order,
    name: i.place_details?.name || 'Place removed',
    category: i.place_details?.category,
    start: formatClock(i.start_time),
    end: formatClock(i.end_time),
    lat: i.place_details?.latitude,
    lng: i.place_details?.longitude,
  }));
}

function groupByDay(items, totalDays) {
  const days = Array.from({ length: Math.max(totalDays, 1) }, (_, i) => ({ day: i + 1, items: [] }));
  items.forEach((item) => {
    const slot = days[item.day - 1] || (days[item.day - 1] = { day: item.day, items: [] });
    slot.items.push(item);
  });
  days.forEach((d) => d.items.sort((a, b) => a.order - b.order));
  return days.filter(Boolean);
}

function dayDate(startDate, day) {
  const d = parseDate(startDate);
  if (!d) return '';
  d.setDate(d.getDate() + day - 1);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return formatDate(iso, { withYear: false });
}

const mapsLink = (lat, lng) =>
  lat != null && lng != null ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}` : null;

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

const STATUS = {
  within_budget: {
    tone: 'bg-emerald-50 ring-emerald-200 text-emerald-900',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    title: 'Within budget',
  },
  over_budget: {
    tone: 'bg-rose-50 ring-rose-200 text-rose-900',
    icon: AlertTriangle,
    iconColor: 'text-rose-600',
    title: 'Over budget',
  },
  incomplete: {
    tone: 'bg-amber-50 ring-amber-200 text-amber-900',
    icon: HelpCircle,
    iconColor: 'text-amber-600',
    title: 'Partial estimate',
  },
};

function CostSummary({ cost, budget }) {
  const total = Number(cost.known_total) || 0;
  const cap = Number(budget) || 0;
  const status = STATUS[cost.budget_status] || STATUS.incomplete;
  const StatusIcon = status.icon;
  const parts = [
    { label: 'Transport', value: Number(cost.transport) || 0, color: 'bg-sky-500' },
    { label: 'Stay', value: Number(cost.accommodation) || 0, color: 'bg-orange-500' },
    { label: 'Attractions', value: Number(cost.attractions) || 0, color: 'bg-emerald-500' },
  ];
  const scale = Math.max(cap, total, 1);

  return (
    <div className="space-y-4">
      <div className={`flex items-start gap-3 p-4 rounded-2xl ring-1 ${status.tone}`}>
        <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${status.iconColor}`} />
        <div className="text-sm">
          <p className="font-semibold">{status.title}</p>
          {cost.budget_status === 'incomplete' && cost.unknown_components?.length > 0 && (
            <p className="mt-0.5">
              Not priced yet: {cost.unknown_components.join(', ')}. Missing prices aren’t counted as free.
            </p>
          )}
          {cost.budget_status === 'over_budget' && (
            <p className="mt-0.5">Known costs are {formatINR(total - cap)} over your {formatINR(cap)} budget.</p>
          )}
          {cost.budget_status === 'within_budget' && (
            <p className="mt-0.5">{formatINR(cap - total)} left of your {formatINR(cap)} budget.</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Known cost</p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{formatINR(total)}</p>
          </div>
          <p className="text-sm text-slate-500 tabular-nums">of {formatINR(cap)} budget</p>
        </div>
        <div className="relative mt-3 h-3 rounded-full bg-stone-100 overflow-hidden flex">
          {parts.map((p) =>
            p.value > 0 ? (
              <div key={p.label} className={`${p.color} h-full`} style={{ width: `${(p.value / scale) * 100}%` }} title={`${p.label}: ${formatINR(p.value)}`} />
            ) : null
          )}
          {cap > 0 && total > cap && (
            <div className="absolute inset-y-0 w-0.5 bg-slate-900" style={{ left: `${(cap / scale) * 100}%` }} />
          )}
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          {parts.map((p) => (
            <div key={p.label} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${p.color}`} />
                {p.label}
              </dt>
              <dd className="font-semibold text-slate-900 tabular-nums text-sm">{formatINR(p.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function ChoiceCard({ icon: Icon, tint, label, children, empty }) {
  return (
    <div className="rounded-2xl ring-1 ring-slate-200 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${tint}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-3">{children || <p className="text-sm text-slate-500">{empty}</p>}</div>
    </div>
  );
}

function TransportChoice({ t }) {
  if (!t) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold text-slate-900">
          {labelFor(TRANSPORT_TYPES, t.type)}
          {t.provider && <span className="font-normal text-slate-500"> · {t.provider}</span>}
        </p>
        <p className="font-bold text-slate-900 tabular-nums">{formatINR(t.estimated_cost)}</p>
      </div>
      <p className="text-sm text-slate-600">
        {t.origin} → {t.destination}
      </p>
      <p className="text-xs text-slate-500">
        {formatDateTime(t.departure_time)} → {formatDateTime(t.arrival_time)}
        {t.duration_seconds > 0 && ` · ${formatDuration(Math.round(t.duration_seconds / 60))}`}
      </p>
      {t.booking_url && (
        <a href={t.booking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-orange-600 hover:underline">
          Book <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function StayChoice({ a }) {
  if (!a) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold text-slate-900">{a.name}</p>
        <p className="font-bold text-slate-900 tabular-nums">{formatINR(a.estimated_total)}</p>
      </div>
      <p className="text-sm text-slate-600">{labelFor(ACCOMMODATION_TYPES, a.type)}</p>
      <p className="text-xs text-slate-500 tabular-nums">
        {formatINR(a.price_per_night)} × {a.nights} night{a.nights === 1 ? '' : 's'}
      </p>
      {a.booking_url && (
        <a href={a.booking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-orange-600 hover:underline">
          Website <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function Itinerary({ days, startDate }) {
  // Open on the first day that has stops (day 1 is often the travel day).
  const firstWithStops = days.find((d) => d.items.length > 0)?.day ?? 1;
  const [active, setActive] = useState(firstWithStops);
  useEffect(() => setActive(firstWithStops), [firstWithStops]);
  const current = days.find((d) => d.day === active) || days[0];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {days.map((d) => (
          <button
            key={d.day}
            type="button"
            onClick={() => setActive(d.day)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-left transition-all ${
              d.day === current.day ? 'bg-slate-900 text-white shadow-md' : 'bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-slate-300'
            }`}
          >
            <p className="text-sm font-semibold">Day {d.day}</p>
            <p className={`text-[11px] ${d.day === current.day ? 'text-white/70' : 'text-slate-400'}`}>
              {dayDate(startDate, d.day)} · {d.items.length} stop{d.items.length === 1 ? '' : 's'}
            </p>
          </button>
        ))}
      </div>

      {current.items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 text-center py-8 rounded-2xl bg-stone-50">
          Nothing scheduled — a travel or free day.
        </p>
      ) : (
        <ol className="mt-5 relative">
          {current.items.map((item, i) => {
            const { icon: Icon, color } = placeMeta(item.category);
            const link = mapsLink(item.lat, item.lng);
            return (
              <li key={item.key} className="relative pl-14 pb-5 last:pb-0 animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                {i < current.items.length - 1 && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-200" />}
                <span className={`absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </span>
                {item.travelMinutes > 0 && (
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                    <Footprints className="w-3 h-3" />
                    ~{item.travelMinutes} min local travel{item.distanceKm ? ` · ${item.distanceKm} km` : ''}
                  </p>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{prettify(item.category)}</p>
                  </div>
                  <p className="flex-shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-slate-900 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {item.start}–{item.end}
                  </p>
                </div>
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-orange-600">
                    <MapPin className="w-3 h-3" /> Map
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-4 text-[11px] text-slate-400">Local travel times are straight-line estimates, not road routes.</p>
    </div>
  );
}

function Dining({ items }) {
  return (
    <ul className="grid sm:grid-cols-2 gap-2">
      {items.map((d) => {
        const Icon = d.category === 'cafe' ? Coffee : UtensilsCrossed;
        const link = mapsLink(d.latitude, d.longitude);
        return (
          <li key={d.id} className="flex items-center gap-3 rounded-2xl ring-1 ring-slate-200 p-3">
            <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 truncate">{d.name}</p>
              <p className="text-xs text-slate-500">
                {prettify(d.category)} · {d.price_available && d.estimated_cost ? formatINR(d.estimated_cost) : 'Price not listed'}
              </p>
            </div>
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Map for ${d.name}`} className="p-2 rounded-full text-slate-400 hover:text-orange-600 hover:bg-orange-50">
                <MapPin className="w-4 h-4" />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Block({ title, subtitle, children }) {
  return (
    <section className="pt-6 border-t border-slate-100">
      <h3 className="font-serif text-lg font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main section                                                        */
/* ------------------------------------------------------------------ */

export default function PlanSection({ trip, reloadKey, onAccommodationAdded, onDiscoverPlaces }) {
  const [full, setFull] = useState(null); // generate response (fresh or cached)
  const [latest, setLatest] = useState(null); // GET latest (itinerary only)
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const plan = await plannerApi.latest(trip.id);
      setLatest(plan);
      const cached = readCache(trip.id);
      setFull(cached?.data?.plan_id === plan.id ? cached.data : null);
    } catch (err) {
      if (err.status === 404) {
        setLatest(null);
        setFull(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [trip.id]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const data = await plannerApi.generate(trip.id);
      writeCache(trip.id, data);
      setFull(data);
      setLatest((l) => (l ? { ...l, id: data.plan_id } : { id: data.plan_id }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // A trip change (new transport/stay saved) makes the shown plan stale.
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (reloadKey > 0 && (full || latest)) setStale(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);
  useEffect(() => {
    if (!generating) return;
    setStale(false);
  }, [generating]);

  const totalDays = nightsBetween(trip.start_date, trip.end_date) + 1;
  const itinerary = useMemo(() => {
    if (full) return fromGenerate(full.itinerary);
    if (latest?.itinerary_items) return fromLatest(latest.itinerary_items);
    return [];
  }, [full, latest]);
  const days = useMemo(() => groupByDay(itinerary, totalDays), [itinerary, totalDays]);
  const hasPlan = !!(full || latest);
  const noPlacesWarning = full?.warnings?.some((w) => /no saved places|no sightseeing/i.test(w));

  return (
    <Card className="!rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="relative p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-orange-500/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold">Your trip plan</h2>
              <p className="text-sm text-white/70 max-w-xl">
                Picks the best transport (65% cost, 35% travel time), your cheapest priced stay, and a day-by-day sightseeing schedule.
              </p>
            </div>
          </div>
          {hasPlan && (
            <Button variant="accent" icon={RefreshCw} onClick={generate} loading={generating} className="flex-shrink-0">
              {generating ? 'Planning…' : 'Regenerate'}
            </Button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {error && (
          <Alert action={<Button size="sm" variant="secondary" onClick={hasPlan ? generate : load}>Retry</Button>}>{error}</Alert>
        )}

        {stale && !generating && (
          <Alert type="info" action={<Button size="sm" onClick={generate}>Update plan</Button>}>
            You changed this trip’s transport or stays. Regenerate to include them.
          </Alert>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 !rounded-2xl" />
            <Skeleton className="h-40 !rounded-2xl" />
          </div>
        ) : generating && !hasPlan ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center animate-pulse">
              <Wand2 className="w-7 h-7" />
            </div>
            <p className="mt-4 font-semibold text-slate-900">Planning your trip…</p>
            <p className="text-sm text-slate-500">Checking flights, stays and places. This can take a few seconds.</p>
          </div>
        ) : !hasPlan ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 flex items-center justify-center rotate-3">
              <Route className="w-7 h-7 -rotate-3" />
            </div>
            <p className="mt-4 font-serif text-xl font-semibold text-slate-900">No plan yet</p>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Save a transport option and a stay with a price for the best result — then let the planner build your itinerary.
            </p>
            <Button variant="accent" icon={Sparkles} onClick={generate} loading={generating} className="mt-5">
              Generate my plan
            </Button>
          </div>
        ) : (
          <>
            {full ? (
              <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
                <CostSummary cost={full.estimated_cost} budget={full.trip?.budget ?? trip.estimated_budget} />
                <div className="grid gap-3">
                  <ChoiceCard icon={Route} tint="bg-sky-50 text-sky-600" label="Getting there" empty="No matching transport — cost not included.">
                    {full.transport && <TransportChoice t={full.transport} />}
                  </ChoiceCard>
                  <ChoiceCard icon={BedDouble} tint="bg-orange-50 text-orange-600" label="Stay" empty="No stay with a known price yet.">
                    {full.accommodation && <StayChoice a={full.accommodation} />}
                  </ChoiceCard>
                </div>
              </div>
            ) : (
              <Alert type="info" action={<Button size="sm" onClick={generate} loading={generating}>Regenerate</Button>}>
                Showing your saved itinerary. Regenerate to see the chosen transport, stay and cost breakdown.
                {latest?.estimated_cost != null && <> Last known cost: <strong>{formatINR(latest.estimated_cost)}</strong>.</>}
              </Alert>
            )}

            {full?.warnings?.length > 0 && (
              <div className="rounded-2xl bg-amber-50/60 ring-1 ring-amber-200 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <AlertTriangle className="w-4 h-4" /> Things to know
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-900/90 list-disc pl-6">
                  {full.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
                {noPlacesWarning && onDiscoverPlaces && (
                  <Button size="sm" variant="secondary" icon={MapPin} onClick={onDiscoverPlaces} className="mt-3">
                    Find places in {trip.destination}
                  </Button>
                )}
              </div>
            )}

            <Block title="Day-by-day itinerary" subtitle="Sightseeing between 9:00 and 17:30, with a lunch break.">
              {itinerary.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 rounded-2xl bg-stone-50">
                  No sightseeing could be scheduled — there are no saved places for {trip.destination} yet.
                </p>
              ) : (
                <Itinerary days={days} startDate={trip.start_date} />
              )}
              {full?.unscheduled_places?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Didn’t fit</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {full.unscheduled_places.map((name) => (
                      <Badge key={name}>{name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Block>

            {full?.hotel_recommendations?.length > 0 && (
              <Block title="Hotels nearby" subtitle="Add one with your quoted nightly price, then regenerate to include it.">
                <HotelPicker
                  key={full.plan_id}
                  tripId={trip.id}
                  hotels={full.hotel_recommendations}
                  onAdd={onAccommodationAdded}
                />
              </Block>
            )}

            {full?.dining_recommendations?.length > 0 && (
              <Block title="Where to eat" subtitle="Not included in the cost estimate.">
                <Dining items={full.dining_recommendations} />
              </Block>
            )}

            {full?.map_attribution && (
              <p className="pt-2 text-[11px] text-slate-400">
                Map data: {full.map_attribution}
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
