import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lockScroll } from '../../utils/scrollLock';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BedDouble,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  ExternalLink,
  Footprints,
  HelpCircle,
  ListChecks,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Search,
  Sparkles,
  Sun,
  Trash2,
  UtensilsCrossed,
  Wand2,
  X,
} from 'lucide-react';
import Button from '../ui/Button';
import { Alert, Badge, Card } from '../ui/Feedback';
import { Skeleton } from '../ui/Skeleton';
import { ConfirmDialog, Modal } from '../ui/Modal';
import HotelPicker from './HotelPicker';
import Photo from '../ui/Photo';
import { destinationsApi, plannerApi } from '../../api/endpoints';
import { ACCOMMODATION_TYPES, TRANSPORT_TYPES, labelFor, prettify } from '../../constants/options';
import { placeMeta } from '../destinations/placeMeta';
import { cityKey, formatDate, formatDateTime, formatDuration, formatINR, nightsBetween, parseDate, titleCase } from '../../utils/format';

// Categories the backend refuses to put in the sightseeing itinerary.
const NON_ITINERARY = new Set([
  'hotel', 'hostel', 'guest_house', 'guesthouse', 'motel', 'apartment',
  'information', 'fuel', 'parking', 'toilets', 'bus_station', 'railway_station',
]);

const mapsLink = (lat, lng) =>
  lat != null && lng != null && lat !== '' && lng !== ''
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
    : null;

function dayLabel(startDate, day) {
  const d = parseDate(startDate);
  if (!d) return '';
  d.setDate(d.getDate() + day - 1);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return formatDate(iso, { withYear: false });
}

/* ------------------------------------------------------------------ */
/* Costs                                                               */
/* ------------------------------------------------------------------ */

const STATUS = {
  within_budget: { tone: 'bg-emerald-50 ring-emerald-200 text-emerald-900', icon: CheckCircle2, iconColor: 'text-emerald-600', title: 'Within budget' },
  over_budget: { tone: 'bg-rose-50 ring-rose-200 text-rose-900', icon: AlertTriangle, iconColor: 'text-rose-600', title: 'Over budget' },
  known_costs_over_budget: { tone: 'bg-rose-50 ring-rose-200 text-rose-900', icon: AlertTriangle, iconColor: 'text-rose-600', title: 'Over budget' },
  incomplete: { tone: 'bg-amber-50 ring-amber-200 text-amber-900', icon: HelpCircle, iconColor: 'text-amber-600', title: 'Rough estimate' },
};

// Friendly names for the backend's unknown_components.
const EXTRA_COSTS = {
  'return transport': { label: 'Return journey', hint: 'Getting back home', icon: Route },
  'local transport': { label: 'Getting around', hint: 'Cabs, autos, local buses', icon: Footprints },
  meals: { label: 'Food & drinks', hint: 'Meals and snacks', icon: UtensilsCrossed },
  'attraction entry fees': { label: 'Place fees', hint: 'Entry charges at places you visit', icon: Sun },
};

function CostRow({ icon: Icon, tint, label, value, missing, missingText }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {missing && <p className="text-xs text-slate-500">{missingText}</p>}
      </div>
      {missing ? (
        <span className="text-xs font-medium text-slate-400 bg-stone-100 px-2.5 py-1 rounded-full">Not added</span>
      ) : (
        <span className="font-semibold text-slate-900 tabular-nums">{formatINR(value)}</span>
      )}
    </li>
  );
}

function CostSummary({ cost, budgetFallback }) {
  const budget = Number(cost.budget ?? budgetFallback) || 0;
  const total = Number(cost.known_total) || 0;
  const left = cost.remaining_known_budget != null ? Number(cost.remaining_known_budget) : budget - total;
  const over = left < 0;
  const pct = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  const unknown = (cost.unknown_components || []).map((u) => String(u).toLowerCase());
  const extras = unknown.filter((u) => EXTRA_COSTS[u]).map((u) => EXTRA_COSTS[u]);
  const transportMissing = cost.transport === null || cost.transport === undefined;
  const stayMissing = cost.accommodation === null || cost.accommodation === undefined;

  return (
    <div className="space-y-5">
      {/* Budget at a glance */}
      <div>
        <p className="text-sm text-slate-500">Your budget</p>
        <p className="text-3xl font-bold text-slate-900 tabular-nums">{formatINR(budget)}</p>
        <div className="mt-3 h-3 rounded-full bg-stone-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${over ? 'bg-rose-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
            style={{ width: `${Math.max(pct, total > 0 ? 3 : 0)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-600">
            <span className="font-semibold text-slate-900 tabular-nums">{formatINR(total)}</span> planned
          </span>
          {over ? (
            <span className="font-semibold text-rose-600 tabular-nums">{formatINR(-left)} over budget</span>
          ) : (
            <span className="text-slate-600">
              <span className="font-semibold text-emerald-600 tabular-nums">{formatINR(left)}</span> left
            </span>
          )}
        </div>
      </div>

      {/* What's counted */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">What we’ve counted</p>
        <ul className="divide-y divide-slate-100">
          <CostRow icon={Route} tint="bg-sky-50 text-sky-600" label="Transport" value={cost.transport}
            missing={transportMissing} missingText="Add a transport option under “Getting there”." />
          <CostRow icon={BedDouble} tint="bg-orange-50 text-orange-600" label="Stay" value={cost.accommodation}
            missing={stayMissing} missingText="Add a hotel with its price under “Where to stay”." />
          {Number(cost.attractions) > 0 && (
            <CostRow icon={Sun} tint="bg-emerald-50 text-emerald-600" label="Places & activities" value={cost.attractions} />
          )}
        </ul>
      </div>

      {/* What isn't */}
      {extras.length > 0 && (
        <div className="rounded-2xl bg-amber-50/70 ring-1 ring-amber-100 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <HelpCircle className="w-4 h-4" /> Keep some money aside for
          </p>
          <p className="mt-0.5 text-xs text-amber-800/80">We can’t estimate these yet, so they aren’t in the total above.</p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {extras.map((e) => (
              <li key={e.label} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                <e.icon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900 truncate">{e.label}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{e.hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
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

/* ------------------------------------------------------------------ */
/* Itinerary editor                                                    */
/* ------------------------------------------------------------------ */

function DayTabs({ days, active, onChange, startDate, countFor }) {
  const rowRef = useRef(null);
  const btnRefs = useRef({});
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges, days.length]);

  useEffect(() => {
    btnRefs.current[active]?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [active]);

  const scrollBy = (dir) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  const onKeyDown = (e) => {
    const i = days.indexOf(active);
    if (e.key === 'ArrowRight' && i < days.length - 1) { e.preventDefault(); onChange(days[i + 1]); }
    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); onChange(days[i - 1]); }
  };

  const arrow = 'absolute top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white shadow-md ring-1 ring-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50';

  return (
    <div className="relative" data-testid="day-tabs">
      {edges.left && (
        <button type="button" aria-label="Previous days" onClick={() => scrollBy(-1)} className={`${arrow} left-0`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div
        ref={rowRef}
        onScroll={updateEdges}
        onKeyDown={onKeyDown}
        className="flex gap-2 overflow-x-auto day-tabs-scroll pb-2 -mx-1 px-1 scroll-smooth"
      >
        {days.map((day) => {
          const isActive = day === active;
          const n = countFor(day);
          return (
            <button
              key={day}
              ref={(el) => { btnRefs.current[day] = el; }}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(day)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-left transition-all ${
                isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-slate-300'
              }`}
            >
              <p className="text-sm font-semibold">Day {day}</p>
              <p className={`text-[11px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                {dayLabel(startDate, day)} · {n} stop{n === 1 ? '' : 's'}
              </p>
            </button>
          );
        })}
      </div>
      {edges.right && (
        <button type="button" aria-label="Next days" onClick={() => scrollBy(1)} className={`${arrow} right-0`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-full text-slate-400 transition-colors disabled:opacity-30 disabled:pointer-events-none ${
        danger ? 'hover:text-rose-600 hover:bg-rose-50' : 'hover:text-slate-900 hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}

function ItineraryEditor({ items, day, totalDays, busy, onDelete, onReorder, onMove, onAdd }) {
  if (items.length === 0) {
    return (
      <div className="mt-5 text-center py-12 rounded-3xl border-2 border-dashed border-slate-200">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <Sun className="w-6 h-6" />
        </div>
        <p className="mt-3 font-semibold text-slate-900">Day {day} has no approved stops yet</p>
        <p className="text-sm text-slate-500">Review the optional suggestions below, or add another place yourself.</p>
        <Button size="sm" icon={Plus} onClick={onAdd} className="mt-4">Add an activity</Button>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <ol className="space-y-0">
        {items.map((item, i) => {
          const { icon: Icon, color } = placeMeta(item.category);
          const link = mapsLink(item.latitude, item.longitude);
          const isBusy = busy === item.id;
          return (
            <li key={item.id}>
              {i > 0 && (
                <div className="flex items-center gap-2 pl-[3.75rem] sm:pl-[5.25rem] py-1.5 text-[11px] text-slate-400">
                  <span className="w-px h-4 bg-slate-200" />
                  <Footprints className="w-3 h-3" />
                  {item.travel_minutes_before > 0
                    ? `~${item.travel_minutes_before} min${item.distance_before_km ? ` · ${item.distance_before_km} km` : ''}`
                    : 'Nearby'}
                </div>
              )}
              <div className={`group flex items-stretch gap-3 transition-opacity ${isBusy ? 'opacity-50' : ''}`}>
                <div className="w-12 sm:w-[4.5rem] flex-shrink-0 pt-4 text-right">
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{item.start_time}</p>
                  <p className="text-[11px] text-slate-400 tabular-nums">{item.end_time}</p>
                </div>
                <div className="flex-1 min-w-0 flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-2xl bg-white ring-1 ring-slate-200 group-hover:ring-orange-200 group-hover:shadow-md group-hover:shadow-slate-900/5 p-3 transition-all">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 truncate">{item.place || 'Removed place'}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      {prettify(item.category)}
                      <span className="text-slate-300">·</span>
                      ~{formatDuration(item.visit_minutes)}
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:text-orange-600">
                          <MapPin className="w-3 h-3" /> Map
                        </a>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-full bg-stone-100/80 p-0.5 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                    <IconBtn label="Move earlier" onClick={() => onReorder(item.id, -1)} disabled={!!busy || i === 0}>
                      <ArrowUp className="w-4 h-4" />
                    </IconBtn>
                    <IconBtn label="Move later" onClick={() => onReorder(item.id, 1)} disabled={!!busy || i === items.length - 1}>
                      <ArrowDown className="w-4 h-4" />
                    </IconBtn>
                    {totalDays > 1 && (
                      <label className="relative w-8 h-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-white cursor-pointer" title="Move to another day">
                        <CalendarRange className="w-4 h-4" />
                        <select
                          aria-label={`Move ${item.place} to another day`}
                          disabled={!!busy}
                          value=""
                          onChange={(e) => e.target.value && onMove(item.id, Number(e.target.value))}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        >
                          <option value="">Move to…</option>
                          {Array.from({ length: totalDays }, (_, k) => k + 1)
                            .filter((d) => d !== day)
                            .map((d) => <option key={d} value={d}>Move to Day {d}</option>)}
                        </select>
                      </label>
                    )}
                    <IconBtn label="Remove" danger onClick={() => onDelete(item)} disabled={!!busy}>
                      <Trash2 className="w-4 h-4" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="pl-[3.75rem] sm:pl-[5.25rem] mt-4">
        <button
          type="button"
          onClick={onAdd}
          disabled={!!busy}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50/40 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add an activity to Day {day}
        </button>
      </div>
      <p className="mt-4 pl-[3.75rem] sm:pl-[5.25rem] text-[11px] text-slate-400">Visit and travel times are estimates; local travel uses straight-line distance.</p>
    </div>
  );
}

function ActivitySuggestions({ items, day, busy, onAdd, onDismiss }) {
  const suggestions = (items || []).filter((item) => item.day === day);

  return (
    <section className="mt-6 rounded-2xl bg-orange-50/60 ring-1 ring-orange-100 p-4">
      <div>
        <h4 className="font-semibold text-slate-900">Suggested for Day {day}</h4>
        <p className="mt-1 text-xs text-slate-600">
          These are ideas, not bookings or planned stops. They are added only if you choose to add them.
          Budget is a guide; you decide whether an extra cost is worthwhile.
        </p>
      </div>
      {suggestions.length ? (
        <ul className="mt-3 space-y-3">
          {suggestions.map((item) => {
            const saving = busy === `suggestion-${item.id}`;
            const link = mapsLink(item.latitude, item.longitude);
            return (
              <li key={item.id} className="rounded-2xl bg-white ring-1 ring-orange-100 p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {item.name}
                      <span className="ml-2 text-xs font-normal text-orange-700">Suggested · not added</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {prettify(item.category)} · about {formatDuration(item.duration_minutes)} · proposed start {item.start_time}
                      {link && <> · <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-orange-700">Map</a></>}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {item.estimated_cost
                        ? `Estimated extra cost: ${formatINR(item.estimated_cost)}`
                        : 'Price not listed; budget impact is unknown.'}
                    </p>
                    {item.would_exceed_budget && (
                      <p className="mt-1 text-xs font-medium text-rose-700">
                        Adding this would exceed the remaining known budget by about {formatINR(item.budget_overage)}.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => onAdd(item)}
                      loading={saving}
                      disabled={!!busy}
                    >
                      {item.would_exceed_budget ? 'Add anyway' : `Add to Day ${day}`}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onDismiss(item)}
                      disabled={!!busy}
                    >
                      Not now
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          No more saved places fit this day. Add places with Discover, or use “Add an activity”.
        </p>
      )}
    </section>
  );
}

const EVENT_STYLE = {
  sightseeing: { icon: Sun, dot: 'bg-orange-500', box: 'bg-white ring-1 ring-slate-200' },
  meal: { icon: UtensilsCrossed, dot: 'bg-amber-400', box: 'bg-amber-50/70 ring-1 ring-amber-100' },
  free_time: { icon: Coffee, dot: 'bg-slate-300', box: 'bg-stone-50 ring-1 ring-dashed ring-stone-200' },
  travel: { icon: Route, dot: 'bg-sky-500', box: 'bg-sky-50/70 ring-1 ring-sky-100' },
};

function Timeline({ schedule }) {
  if (!schedule) return <p className="mt-5 text-sm text-slate-500">No timeline for this day.</p>;
  return (
    <ol className="mt-5 space-y-2">
      {schedule.events.map((ev, i) => {
        const s = EVENT_STYLE[ev.type] || EVENT_STYLE.free_time;
        const Icon = s.icon;
        return (
          <li key={`${ev.start_time}-${i}`} className="flex gap-3">
            <div className="w-14 flex-shrink-0 pt-3 text-right text-xs font-semibold text-slate-500 tabular-nums">{ev.start_time}</div>
            <div className={`flex-1 rounded-2xl px-4 py-3 ${s.box}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 font-semibold text-slate-900">
                  <Icon className="w-4 h-4 text-slate-400" />
                  {ev.type === 'free_time' ? 'Open time' : ev.title}
                  {ev.type === 'meal' && ev.place?.name && <span className="font-normal text-slate-600">· {ev.place.name}</span>}
                </p>
                <span className="flex-shrink-0 text-xs text-slate-400 tabular-nums">
                  {ev.start_time}–{ev.end_time}
                </span>
              </div>
              {ev.note && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {ev.type === 'free_time'
                    ? 'Review the optional suggestions below; this time stays open unless you choose to add one.'
                    : ev.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function AddActivity({ trip, day, scheduledNames, onSubmit, onCancel }) {
  const [allPlaces, setAllPlaces] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState(null);
  const [start, setStart] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    destinationsApi
      .list()
      .then((list) => {
        const dest = list.find((d) => cityKey(d.name) === cityKey(trip.destination));
        if (alive) setAllPlaces(dest?.places || []);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [trip.destination]);

  // Filter locally so plan edits don't refetch every destination.
  const places = useMemo(
    () =>
      allPlaces &&
      allPlaces.filter(
        (p) => !NON_ITINERARY.has(String(p.category).toLowerCase()) && !scheduledNames.has(`${p.name}|${Number(p.latitude)}|${Number(p.longitude)}`)
      ),
    [allPlaces, scheduledNames]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (places || []).filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.category).includes(q));
  }, [places, query]);

  const submit = async () => {
    if (!chosen) return;
    setSaving(true);
    setError('');
    try {
      await onSubmit({ day, place_id: chosen.id, ...(start ? { start_time: start } : {}) });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>{error}</Alert>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places"
          className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
        />
      </div>
      {!places ? (
        <Skeleton className="h-48 !rounded-2xl" />
      ) : filtered.length === 0 ? (
        places.length === 0 ? (
          <div className="text-center py-6 px-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="mt-3 font-semibold text-slate-900">Every sightseeing spot is already in your plan</p>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              All the sightseeing places we have for {titleCase(trip.destination)} are already on one of your days.
              You can move a stop to Day {day} from another day instead.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-6">No places match your search.</p>
        )
      ) : (
        <ul className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
          {filtered.map((p) => {
            const { icon: Icon, color } = placeMeta(p.category);
            const selected = chosen?.id === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setChosen(p)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${selected ? 'bg-orange-50 ring-1 ring-orange-300' : 'hover:bg-stone-50'}`}
                >
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900 truncate">{p.name}</span>
                    <span className="block text-xs text-slate-500">{prettify(p.category)}</span>
                  </span>
                  {selected && <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-2 border-t border-slate-100">
        <label className="text-xs font-medium text-slate-600">
          Start time <span className="font-normal text-slate-400">(optional)</span>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 block rounded-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
          />
        </label>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving} disabled={!chosen}>Add to Day {day}</Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recommendations                                                     */
/* ------------------------------------------------------------------ */

function Dining({ items }) {
  const [shown, setShown] = useState(10);
  return (
    <>
    <ul className="grid sm:grid-cols-2 gap-2">
      {items.slice(0, shown).map((d) => {
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
    {items.length > shown && (
      <button
        type="button"
        onClick={() => setShown((n) => n + 20)}
        className="mt-3 w-full py-2.5 rounded-2xl text-sm font-medium text-slate-600 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 transition-colors"
      >
        Show more places to eat ({items.length - shown} more)
      </button>
    )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Plan modal shell                                                    */
/* ------------------------------------------------------------------ */

function PlanModal({ open, onClose, closeOnEscape, header, children }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const escRef = useRef(closeOnEscape);
  escRef.current = closeOnEscape;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && escRef.current && closeRef.current();
    document.addEventListener('keydown', onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlock();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Trip plan"
        className="relative w-full sm:max-w-5xl h-[94vh] sm:h-[90vh] flex flex-col bg-stone-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-pop">
        {header}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main section                                                        */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: 'overview', label: 'Overview', icon: Sparkles },
  { key: 'itinerary', label: 'Itinerary', icon: ListChecks },
  { key: 'timeline', label: 'Full day', icon: CalendarRange },
  { key: 'extras', label: 'Hotels & food', icon: UtensilsCrossed },
];

export default function PlanSection({ trip, reloadKey = 0, onAccommodationAdded, onGenerated }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [needsRegen, setNeedsRegen] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [busy, setBusy] = useState(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [useAI, setUseAI] = useState(false);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [stale, setStale] = useState(false);
  const [autoUpdating, setAutoUpdating] = useState(false);

  const totalDays = nightsBetween(trip.start_date, trip.end_date) + 1;
  const [activeDay, setActiveDay] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setNeedsRegen(false);
    try {
      const latest = await plannerApi.latest(trip.id);
      setPlan(latest);
      // Dates, travellers, budget, travel or stay changed since this plan was made.
      if (latest?.stale) setStale(true);
    } catch (err) {
      setPlan(null);
      if (err.status === 409) setNeedsRegen(true);
      else if (err.status !== 404) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trip.id]);

  useEffect(() => {
    load();
  }, [load]);

  const itinerary = plan?.itinerary || [];
  // Stops can sit past the trip's last day if the dates were shortened;
  // keep those days reachable so they can be moved or removed.
  const lastStopDay = itinerary.reduce((max, i) => Math.max(max, i.day || 0), 0);
  const days = useMemo(
    () => Array.from({ length: Math.max(totalDays, lastStopDay, 1) }, (_, i) => i + 1),
    [totalDays, lastStopDay]
  );
  const firstDayWithStops = (list) => {
    const d = (list || []).reduce((min, i) => Math.min(min, i.day), Infinity);
    return Number.isFinite(d) ? d : 1;
  };
  useEffect(() => {
    if (plan) setActiveDay(firstDayWithStops(plan.itinerary));
    // only when a different plan arrives, not after each edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.plan_id]);

  useEffect(() => {
    if (reloadKey > 0 && plan) setStale(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // `auto`: rebuild in place after the trip changed, keeping the AI choice
  // the plan was made with and not opening the plan window.
  const generate = async ({ auto = false } = {}) => {
    setConfirmRegen(false);
    if (!auto) {
      setOpen(true);
      setTab('overview');
    }
    setGenerating(true);
    setAutoUpdating(auto);
    setError('');
    setEditError('');
    try {
      const ai = auto ? plan?.planner?.mode === 'ai' : useAI;
      const data = await plannerApi.generate(trip.id, ai);
      setPlan(data);
      setNeedsRegen(false);
      setStale(false);
      setUseAI(false);
      setActiveDay(firstDayWithStops(data.itinerary));
      autoTried.current = 0;
      onGenerated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setAutoUpdating(false);
    }
  };

  // An out-of-date plan is misleading, so rebuild it automatically. The short
  // delay groups several quick changes (e.g. picking a flight and a hotel).
  const autoTried = useRef(0);
  useEffect(() => {
    if (!stale || !plan || generating || loading) return undefined;
    if (autoTried.current >= 3) return undefined; // don't loop on a failing generate
    const timer = setTimeout(() => {
      autoTried.current += 1;
      generate({ auto: true });
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale, plan?.plan_id, generating, loading, reloadKey]);

  const askGenerate = () => (plan ? setConfirmRegen(true) : generate());

  const edit = async (key, fn) => {
    setBusy(key);
    setEditError('');
    try {
      const updated = await fn();
      if (updated) setPlan(updated);
    } catch (err) {
      if (err.status === 409) setNeedsRegen(true);
      if (err.status === 404) load();
      setEditError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const dayItems = useMemo(
    () => itinerary.filter((i) => i.day === activeDay).sort((a, b) => a.order - b.order),
    [itinerary, activeDay]
  );

  const reorder = (itemId, delta) => {
    const ids = dayItems.map((i) => i.id);
    const from = ids.indexOf(itemId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    edit(itemId, () => plannerApi.reorderDay(trip.id, activeDay, ids));
  };
  const move = (itemId, day) => edit(itemId, () => plannerApi.moveItem(trip.id, itemId, { day }));
  const remove = async () => {
    const item = confirmDelete;
    setConfirmDelete(null);
    await edit(item.id, () => plannerApi.deleteItem(trip.id, item.id));
  };
  const add = async (body) => {
    try {
      setPlan(await plannerApi.addItem(trip.id, body));
      setAdding(false);
    } catch (err) {
      if (err.status === 409) {
        setNeedsRegen(true);
        setAdding(false);
      }
      throw err;
    }
  };
  const addSuggestion = (suggestion) => edit(
    `suggestion-${suggestion.id}`,
    () => plannerApi.addItem(trip.id, {
      day: suggestion.day,
      place_id: suggestion.id,
      start_time: suggestion.start_time,
    })
  );
  const dismissSuggestion = (suggestion) => edit(
    `suggestion-${suggestion.id}`,
    () => plannerApi.dismissSuggestion(trip.id, suggestion.id)
  );

  // Backend warnings, minus technical ones that don't matter to the traveller.
  const warnings = useMemo(() => {
    const list = plan?.warnings || [];
    return list
      .map((w) => {
        if (/^flight search skipped/i.test(w) || /flight provider is temporarily unavailable/i.test(w) || /no usable inr flight offers/i.test(w)) {
          return plan?.transport ? null : 'The app does not import live flight offers. Search externally and add the quote you want to compare.';
        }
        if (/^no priced transport option is saved/i.test(w)) {
          return plan?.transport ? null : 'No priced transport option is saved. Search externally and add a verified quote to compare options.';
        }
        return w;
      })
      .concat(
        lastStopDay > totalDays
          ? [`Some stops are on days after your trip ends (Day ${totalDays}). Move or remove them, or regenerate the plan.`]
          : []
      )
      .filter((w, i, all) => w && all.indexOf(w) === i);
  }, [plan, lastStopDay, totalDays]);

  const scheduledNames = useMemo(
    () => new Set(itinerary.filter((i) => i.place).map((i) => `${i.place}|${Number(i.latitude)}|${Number(i.longitude)}`)),
    [itinerary]
  );
  const schedule = plan?.daily_schedule?.find((d) => d.day === activeDay);
  const cost = plan?.estimated_cost || {};
  const status = STATUS[cost.budget_status] || STATUS.incomplete;
  const StatusIcon = status.icon;
  const extrasCount =
    (plan?.hotel_recommendations?.length || 0) + (plan?.dining_recommendations?.length || 0) + (plan?.nearby_recommendations?.length || 0);
  const childDialogOpen = confirmRegen || !!confirmDelete || adding;

  /* ---------- compact card on the trip page ---------- */
  const summaryCard = (
    <Card className="!rounded-3xl overflow-hidden">
      <div className="relative p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-orange-500/25 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-2xl font-semibold">Your trip plan</h2>
              {loading ? (
                <Skeleton className="mt-2 h-4 w-64 !bg-white/15" />
              ) : plan ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/15">
                    <StatusIcon className="w-3.5 h-3.5" /> {status.title}
                  </span>
                  <span className="text-white/80 tabular-nums">
                    {formatINR(cost.known_total)} planned of {formatINR(cost.budget ?? trip.estimated_budget)} budget
                  </span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/80">{itinerary.length} stops over {totalDays} days</span>
                  {plan.planner?.mode === 'ai' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-400/20 ring-1 ring-orange-200/30 text-orange-100">
                      <Sparkles className="w-3.5 h-3.5" /> AI-assisted
                    </span>
                  )}
                </div>
              ) : needsRegen ? (
                <p className="mt-1 text-sm text-white/70">This plan was made by an older planner version and needs regenerating.</p>
              ) : (
                <p className="mt-1 text-sm text-white/70 max-w-lg">
                  We’ll balance your saved quotes by cost and convenience, choose a budget-fitting combination when possible, and show up to three alternatives.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {plan ? (
              <>
                <Button variant="accent" icon={ListChecks} onClick={() => { setTab('overview'); setOpen(true); }}>Open plan</Button>
                <Button variant="light" icon={RefreshCw} onClick={askGenerate} loading={generating}>Regenerate</Button>
              </>
            ) : (
              <Button variant="accent" icon={Sparkles} onClick={generate} loading={generating} disabled={loading}>
                {needsRegen ? 'Regenerate plan' : 'Generate my plan'}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-orange-600"
            checked={useAI}
            onChange={(event) => setUseAI(event.target.checked)}
            disabled={loading || generating}
          />
          <span>
            <span className="block font-semibold text-slate-900">Use AI to assign sightseeing places to trip days</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
              AI cannot browse the web; it only arranges sightseeing places saved for this destination. If none are saved, the planner finds them from OpenStreetMap first. It does not find transport or hotel offers. When selected, the route, dates, traveller count, budget, travel mode, and saved place details are sent to Cloudflare Workers AI (Qwen3.8 27B). Cloudflare lists zero data retention for this model and a 10,000-Neuron daily free allowance; usage above the allowance can be billable. Failed AI requests fall back to the standard planner.
            </span>
          </span>
        </label>
      </div>
      {(stale || (error && !open)) && (
        <div className="p-4 sm:px-6 space-y-2">
          {stale && (
            <Alert type="info" action={<Button size="sm" onClick={() => generate({ auto: true })} loading={generating}>Update now</Button>}>
              {autoUpdating ? 'Trip changed — updating your plan…' : 'Trip changed — your plan will update automatically.'}
            </Alert>
          )}
          {error && !open && <Alert>{error}</Alert>}
        </div>
      )}
    </Card>
  );

  /* ---------- modal header ---------- */
  const header = (
    <div className="relative isolate text-white flex-shrink-0">
      <Photo name={trip.destination} width={1400} height={360} className="-z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-slate-900/20" aria-hidden="true" />
      <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">Your trip plan</p>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-shadow truncate">{titleCase(trip.destination)}</h2>
            <p className="mt-1 text-sm text-white/80">
              {titleCase(trip.source)} → {titleCase(trip.destination)} · {totalDays} days · {trip.number_of_people} {Number(trip.number_of_people) === 1 ? 'traveller' : 'travellers'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {plan && (
              <Button variant="light" size="sm" icon={RefreshCw} onClick={() => setConfirmRegen(true)} loading={generating} className="hidden sm:inline-flex">
                Regenerate
              </Button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close plan"
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white hover:text-slate-900 ring-1 ring-white/25 backdrop-blur flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {plan && !generating && (
          <div className="mt-5 flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-sm font-semibold transition-colors ${
                  tab === t.key ? 'bg-stone-50 text-slate-900' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}>
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.key === 'itinerary' && <span className={`text-xs tabular-nums ${tab === t.key ? 'text-slate-400' : 'text-white/50'}`}>{itinerary.length}</span>}
                {t.key === 'extras' && extrasCount > 0 && <span className={`text-xs tabular-nums ${tab === t.key ? 'text-slate-400' : 'text-white/50'}`}>{extrasCount}</span>}
              </button>
            ))}
          </div>
        )}
        {(!plan || generating) && <div className="h-6" />}
      </div>
    </div>
  );

  /* ---------- modal body ---------- */
  let body;
  if (generating) {
    body = (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-3xl bg-orange-200/60 animate-ping" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/30">
            <Wand2 className="w-9 h-9" />
          </div>
        </div>
        <p className="mt-6 font-serif text-2xl font-semibold text-slate-900">Planning your trip…</p>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">Checking the city and adding missing OpenStreetMap places, then building your itinerary. This can take a little while.</p>
      </div>
    );
  } else if (!plan) {
    body = (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        {error ? (
          <>
            <Alert>{error}</Alert>
            <Button variant="accent" icon={RefreshCw} onClick={generate} className="mt-4">Try again</Button>
          </>
        ) : (
          <p className="text-sm text-slate-500">No plan yet.</p>
        )}
      </div>
    );
  } else {
    body = (
      <div className="p-5 sm:p-8 space-y-6">
        {error && <Alert>{error}</Alert>}
        {plan.data_preparation &&
          (plan.data_preparation.destination_created || plan.data_preparation.places_added > 0) && (
            <Alert type="info">
              Added {plan.data_preparation.places_added} OpenStreetMap place
              {plan.data_preparation.places_added === 1 ? '' : 's'} for {titleCase(plan.data_preparation.destination)}.
              {' '}{plan.data_preparation.places_available} place records are now available for this destination.
            </Alert>
          )}
        {stale && (
          <Alert type="info" action={<Button size="sm" onClick={() => generate({ auto: true })}>Update now</Button>}>
            Trip changed — your plan will update automatically.
          </Alert>
        )}

        {tab === 'overview' && (
          <>
            <div className="grid lg:grid-cols-[1.15fr_1fr] gap-5">
              <Card className="!rounded-3xl p-5 sm:p-6">
                <CostSummary cost={cost} budgetFallback={trip.estimated_budget} />
              </Card>
              <div className="grid gap-4 content-start">
                <ChoiceCard icon={Route} tint="bg-sky-50 text-sky-600" label="Travel" empty="No priced transport saved — cost not included.">
                  {plan.transport && (
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {labelFor(TRANSPORT_TYPES, plan.transport.type)}
                          {plan.transport.provider && <span className="font-normal text-slate-500"> · {plan.transport.provider}</span>}
                        </p>
                        <p className="font-bold text-slate-900 tabular-nums">{formatINR(plan.transport.estimated_cost)}</p>
                      </div>
                      <Badge tone="emerald">{plan.transport.is_selected ? 'Your pick' : 'Balanced pick'}</Badge>
                      <p className="text-sm text-slate-600">{titleCase(plan.transport.origin)} → {titleCase(plan.transport.destination)}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(plan.transport.departure_time)} → {formatDateTime(plan.transport.arrival_time)}
                        {plan.transport.duration_seconds > 0 && ` · ${formatDuration(Math.round(plan.transport.duration_seconds / 60))}`}
                      </p>
                      {plan.return_transport ? (
                        <p className="text-xs text-slate-500">
                          Back: {labelFor(TRANSPORT_TYPES, plan.return_transport.type)}
                          {plan.return_transport.provider && ` · ${plan.return_transport.provider}`}
                          {' · '}{formatDateTime(plan.return_transport.departure_time)}
                          {' · '}<span className="tabular-nums">{formatINR(plan.return_transport.estimated_cost)}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">One way — no return option saved.</p>
                      )}
                      {(plan.transport.is_estimate || plan.return_transport?.is_estimate) && (
                        <p className="text-[11px] text-amber-700">Typical fares — check the real price before booking. Change it under Travel.</p>
                      )}
                      {plan.transport.booking_url && (
                        <a href={plan.transport.booking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-orange-600 hover:underline">
                          View search / quote <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </ChoiceCard>
                <ChoiceCard icon={BedDouble} tint="bg-orange-50 text-orange-600" label="Stay" empty="No stay with a price yet — add one in Hotels & food.">
                  {plan.accommodation && (
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold text-slate-900">{plan.accommodation.name}</p>
                        <p className="font-bold text-slate-900 tabular-nums">{formatINR(plan.accommodation.estimated_total)}</p>
                      </div>
                      <Badge tone="emerald">{plan.accommodation.is_selected ? 'Your pick' : 'Balanced pick'}</Badge>
                      <p className="text-sm text-slate-600">{labelFor(ACCOMMODATION_TYPES, plan.accommodation.type)}</p>
                      {plan.accommodation.location && (
                        <p className="text-sm text-slate-600">{plan.accommodation.location}</p>
                      )}
                      <p className="text-xs text-slate-500 tabular-nums">
                        {formatINR(plan.accommodation.price_per_night)} × {plan.accommodation.nights} night{plan.accommodation.nights === 1 ? '' : 's'} (estimate)
                      </p>
                      {plan.accommodation.rating != null && (
                        <p className="text-xs text-slate-500">User-entered rating: {Number(plan.accommodation.rating).toFixed(1)} / 5</p>
                      )}
                      {plan.accommodation.nearest_sightseeing_distance_km != null && (
                        <p className="text-xs text-slate-500">
                          About {Number(plan.accommodation.nearest_sightseeing_distance_km).toFixed(1)} km straight-line to the nearest planned stop
                          {plan.accommodation.nearest_sightseeing_place ? ` (${plan.accommodation.nearest_sightseeing_place})` : ''}.
                        </p>
                      )}
                      {plan.accommodation.price_warning && (
                        <p className="flex items-start gap-1 text-[11px] text-amber-700">
                          <AlertTriangle className="w-3 h-3 mt-px flex-shrink-0" /> {plan.accommodation.price_warning}
                        </p>
                      )}
                    </div>
                  )}
                </ChoiceCard>
              </div>
            </div>

            {(plan.transport_alternatives?.length > 0 || plan.accommodation_alternatives?.length > 0) && (
              <div className="grid lg:grid-cols-2 gap-5">
                {plan.transport_alternatives?.length > 0 && (
                  <Card className="!rounded-3xl p-5 sm:p-6">
                    <h3 className="font-serif text-lg font-semibold text-slate-900">Other transport options</h3>
                    <p className="mt-1 text-xs text-slate-500">Up to three alternatives from your saved, user-verified quotes.</p>
                    <ol className="mt-4 space-y-3">
                      {plan.transport_alternatives.map((option, index) => (
                        <li key={option.id} className="rounded-2xl bg-stone-50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alternative {index + 1}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {labelFor(TRANSPORT_TYPES, option.type)}
                                {option.provider && <span className="font-normal text-slate-500"> · {option.provider}</span>}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{formatINR(option.estimated_cost)}</p>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{titleCase(option.origin)} → {titleCase(option.destination)}</p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(option.departure_time)} → {formatDateTime(option.arrival_time)}
                            {option.duration_seconds > 0 && ` · ${formatDuration(Math.round(option.duration_seconds / 60))}`}
                          </p>
                          {option.booking_url && (
                            <a href={option.booking_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                              View search / quote <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  </Card>
                )}
                {plan.accommodation_alternatives?.length > 0 && (
                  <Card className="!rounded-3xl p-5 sm:p-6">
                    <h3 className="font-serif text-lg font-semibold text-slate-900">Other stays</h3>
                    <p className="mt-1 text-xs text-slate-500">Up to three alternatives using the nightly quotes you entered.</p>
                    <ol className="mt-4 space-y-3">
                      {plan.accommodation_alternatives.map((option, index) => (
                        <li key={option.id} className="rounded-2xl bg-stone-50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alternative {index + 1}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{option.name}</p>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{formatINR(option.estimated_total)}</p>
                          </div>
                          {option.location && <p className="mt-1 text-xs text-slate-600">{option.location}</p>}
                          <p className="text-xs text-slate-500">
                            {formatINR(option.price_per_night)} per night
                            {option.rating != null && ` · user-entered rating ${Number(option.rating).toFixed(1)} / 5`}
                          </p>
                          {option.nearest_sightseeing_distance_km != null && (
                            <p className="text-xs text-slate-500">
                              About {Number(option.nearest_sightseeing_distance_km).toFixed(1)} km straight-line to the nearest planned stop
                              {option.nearest_sightseeing_place ? ` (${option.nearest_sightseeing_place})` : ''}.
                            </p>
                          )}
                          {option.booking_url && (
                            <a href={option.booking_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                              View stay details <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  </Card>
                )}
              </div>
            )}

            <Card className="!rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold text-slate-900">Days at a glance</h3>
                <Button size="sm" variant="secondary" onClick={() => setTab('itinerary')}>Edit itinerary</Button>
              </div>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                {days.map((d) => {
                  const stops = itinerary.filter((i) => i.day === d).sort((a, b) => a.order - b.order);
                  const suggestion = plan.activity_suggestions?.find((item) => item.day === d);
                  return (
                    <li key={d}>
                      <button type="button" onClick={() => { setActiveDay(d); setTab('itinerary'); }}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-2xl bg-stone-50 hover:bg-orange-50 transition-colors">
                        <span className="w-10 h-10 rounded-xl bg-white ring-1 ring-slate-200 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[9px] uppercase text-slate-400 leading-none">Day</span>
                          <span className="text-sm font-bold text-slate-900 leading-none mt-0.5">{d}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs text-slate-400">{dayLabel(trip.start_date, d)}</span>
                          <span className="block text-sm text-slate-700 truncate">
                            {stops.length
                              ? `${stops.map((s) => s.place).join(' · ')}${suggestion ? ` · Suggested: ${suggestion.name} (not added)` : ''}`
                              : suggestion
                                ? `Suggested: ${suggestion.name} · not added`
                                : 'No saved activity suggestion'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {warnings.length > 0 && (
              <details className="rounded-3xl bg-amber-50/70 ring-1 ring-amber-200 p-5 group">
                <summary className="flex items-center gap-2 text-sm font-semibold text-amber-900 cursor-pointer list-none">
                  <AlertTriangle className="w-4 h-4" /> Things to know ({warnings.length})
                  <span className="ml-auto text-xs font-normal text-amber-700 group-open:hidden">Show</span>
                  <span className="ml-auto text-xs font-normal text-amber-700 hidden group-open:inline">Hide</span>
                </summary>
                <ul className="mt-3 space-y-1.5 text-sm text-amber-900/90 list-disc pl-6">
                  {warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </details>
            )}
          </>
        )}

        {(tab === 'itinerary' || tab === 'timeline') && (
          <Card className="!rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
              <div>
                <h3 className="font-serif text-xl font-semibold text-slate-900">{tab === 'itinerary' ? 'Itinerary' : 'Full day'}</h3>
                <p className="text-sm text-slate-500">
                  {tab === 'itinerary'
                    ? 'Reorder, move or remove planned stops. Optional suggestions are added only after you approve them.'
                    : 'Your planned stops, meal breaks, open time, and optional additions.'}
                </p>
              </div>
            </div>
            <Alert>{editError}</Alert>
            <div className={editError ? 'mt-3' : ''}>
              <DayTabs days={days} active={activeDay} onChange={setActiveDay} startDate={trip.start_date} countFor={(d) => itinerary.filter((i) => i.day === d).length} />
            </div>
            {tab === 'itinerary' ? (
              <ItineraryEditor items={dayItems} day={activeDay} totalDays={totalDays} busy={busy}
                onDelete={setConfirmDelete} onReorder={reorder} onMove={move} onAdd={() => setAdding(true)} />
            ) : (
              <Timeline schedule={schedule} />
            )}
            <ActivitySuggestions
              items={plan.activity_suggestions}
              day={activeDay}
              busy={busy}
              onAdd={addSuggestion}
              onDismiss={dismissSuggestion}
            />
            {plan.unscheduled_places?.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Didn’t fit into your days</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {plan.unscheduled_places.map((name) => <Badge key={name}>{name}</Badge>)}
                </div>
              </div>
            )}
          </Card>
        )}

        {tab === 'extras' && (
          <div className="space-y-5">
            <Card className="!rounded-3xl p-5 sm:p-6">
              <h3 className="font-serif text-xl font-semibold text-slate-900">Hotels nearby</h3>
              <p className="text-sm text-slate-500 mb-4">Add one with your quoted nightly price, then regenerate to include it.</p>
              {plan.hotel_recommendations?.length > 0 ? (
                <HotelPicker key={plan.plan_id} tripId={trip.id} hotels={plan.hotel_recommendations} onAdd={onAccommodationAdded} />
              ) : (
                <p className="text-sm text-slate-500">No hotels are saved for {titleCase(trip.destination)}. Add your stay under “Where to stay”.</p>
              )}
            </Card>
            {plan.dining_recommendations?.length > 0 && (
              <Card className="!rounded-3xl p-5 sm:p-6">
                <h3 className="font-serif text-xl font-semibold text-slate-900">Where to eat</h3>
                <p className="text-sm text-slate-500 mb-4">Not included in the cost estimate. Check opening hours and prices.</p>
                <Dining items={plan.dining_recommendations} />
              </Card>
            )}
            {plan.nearby_recommendations?.length > 0 && (
              <Card className="!rounded-3xl p-5 sm:p-6">
                <h3 className="font-serif text-xl font-semibold text-slate-900">Other places nearby</h3>
                <p className="text-sm text-slate-500 mb-4">Saved places that aren’t sightseeing spots or places to eat.</p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.nearby_recommendations.map((n) => {
                    const link = mapsLink(n.latitude, n.longitude);
                    return link ? (
                      <a key={n.id} href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-100 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-700">
                        <MapPin className="w-3 h-3" /> {n.name}
                      </a>
                    ) : <Badge key={n.id}>{n.name}</Badge>;
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

      </div>
    );
  }

  return (
    <>
      {summaryCard}
      <PlanModal open={open} onClose={() => setOpen(false)} closeOnEscape={!childDialogOpen} header={header}>
        {body}
      </PlanModal>

      <ConfirmDialog
        open={confirmRegen}
        title="Regenerate your plan?"
        message={`This builds a fresh plan and replaces your current itinerary, including any changes you made.${useAI ? ' Your trip details and saved sightseeing-place data will be sent to Cloudflare Workers AI.' : ''}`}
        confirmLabel="Regenerate"
        onConfirm={generate}
        onCancel={() => setConfirmRegen(false)}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove this stop?"
        message={confirmDelete ? `${confirmDelete.place} will be removed from Day ${confirmDelete.day}.` : ''}
        confirmLabel="Remove"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(null)}
      />
      <Modal open={adding} title={`Add an activity to Day ${activeDay}`} onClose={() => setAdding(false)}>
        {adding && <AddActivity trip={trip} day={activeDay} scheduledNames={scheduledNames} onSubmit={add} onCancel={() => setAdding(false)} />}
      </Modal>
    </>
  );
}
