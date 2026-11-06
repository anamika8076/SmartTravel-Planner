import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Luggage, MapPinned, Plus, RotateCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Hero from '../components/ui/Hero';
import Pills from '../components/ui/Pills';
import { Alert, EmptyState } from '../components/ui/Feedback';
import { CardGridSkeleton, Skeleton } from '../components/ui/Skeleton';
import TripCard from '../components/trips/TripCard';
import { tripsApi } from '../api/endpoints';
import { daysUntil, formatDateRange, formatINR, tripStatus } from '../utils/format';
import { PHOTOS } from '../utils/visuals';
import Photo from '../components/ui/Photo';
import { useAuth } from '../context/AuthContext';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'On the road' },
  { key: 'completed', label: 'Completed' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function HeroStat({ label, value }) {
  return (
    <div className="min-w-0 px-3 sm:px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-inset ring-white/20">
      <p className="text-lg sm:text-2xl font-bold tabular-nums truncate">{value}</p>
      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/70 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function NextTrip({ trip }) {
  const status = tripStatus(trip.start_date, trip.end_date);
  const days = daysUntil(trip.start_date);
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group relative block rounded-3xl overflow-hidden bg-white text-slate-900 shadow-2xl shadow-black/30 ring-1 ring-white/40 animate-float"
    >
      <div className="relative h-36 text-white">
        <Photo name={trip.destination} width={640} height={300} />
        <div className="relative h-full p-4 flex flex-col justify-between">
          <span className="self-start px-2.5 py-1 rounded-full bg-orange-500 text-[11px] font-bold uppercase tracking-wider shadow">
            {status === 'ongoing' ? 'Happening now' : 'Next adventure'}
          </span>
          <p className="font-serif text-3xl font-semibold capitalize truncate text-shadow">{trip.destination}</p>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 capitalize truncate">From {trip.source}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            {formatDateRange(trip.start_date, trip.end_date)}
          </p>
        </div>
        {status === 'upcoming' ? (
          <div className="text-center flex-shrink-0 px-3 py-2 rounded-2xl bg-orange-50">
            <p className="text-2xl font-bold tabular-nums leading-none text-orange-600">{days}</p>
            <p className="text-[10px] uppercase tracking-wider text-orange-700/70 mt-1">{days === 1 ? 'day' : 'days'} to go</p>
          </div>
        ) : (
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        )}
      </div>
    </Link>
  );
}

export default function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setTrips(await tripsApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const withStatus = useMemo(
    () =>
      trips
        .map((t) => ({ ...t, _status: tripStatus(t.start_date, t.end_date) }))
        .sort((a, b) => {
          // Upcoming/ongoing soonest first, completed trips last (most recent first).
          const ac = a._status === 'completed';
          const bc = b._status === 'completed';
          if (ac !== bc) return ac ? 1 : -1;
          return ac ? b.start_date.localeCompare(a.start_date) : a.start_date.localeCompare(b.start_date);
        }),
    [trips]
  );

  const counts = useMemo(() => {
    const c = { all: withStatus.length };
    withStatus.forEach((t) => (c[t._status] = (c[t._status] || 0) + 1));
    return c;
  }, [withStatus]);

  const nextTrip = withStatus.find((t) => t._status !== 'completed');
  const plannedBudget = withStatus
    .filter((t) => t._status !== 'completed')
    .reduce((sum, t) => sum + (Number(t.estimated_budget) || 0), 0);
  const visible = filter === 'all' ? withStatus : withStatus.filter((t) => t._status === filter);

  return (
    <div className="space-y-8">
      <Hero src={PHOTOS.lakeBow} name="home">
        <div className="flex-1 grid lg:grid-cols-[1fr_minmax(0,21rem)] gap-8 items-end">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-white/85">
                {greeting()}
                {user?.username ? `, ${user.username}` : ''} 👋
              </p>
              <h1 className="mt-2 font-serif text-5xl sm:text-6xl font-semibold tracking-tight text-shadow">
                Where to <span className="italic text-orange-300">next?</span>
              </h1>
            </div>
            {loading ? (
              <div className="flex gap-3">
                <Skeleton className="h-16 w-28 !bg-white/20 !rounded-2xl" />
                <Skeleton className="h-16 w-28 !bg-white/20 !rounded-2xl" />
                <Skeleton className="h-16 w-36 !bg-white/20 !rounded-2xl" />
              </div>
            ) : (
              trips.length > 0 && (
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                  <HeroStat label="Trips planned" value={counts.all || 0} />
                  <HeroStat label="Coming up" value={(counts.upcoming || 0) + (counts.ongoing || 0)} />
                  <HeroStat label="Upcoming budget" value={formatINR(plannedBudget)} />
                </div>
              )
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="accent" to="/trips/new" icon={Plus}>
                Plan a new trip
              </Button>
              <Button variant="light" to="/destinations" icon={MapPinned}>
                Explore destinations
              </Button>
            </div>
          </div>
          {!loading && nextTrip && <NextTrip trip={nextTrip} />}
        </div>
      </Hero>

      {loading ? (
        <CardGridSkeleton tall />
      ) : error ? (
        <Alert action={<Button size="sm" variant="secondary" icon={RotateCw} onClick={load}>Retry</Button>}>{error}</Alert>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title="Your passport is empty"
          action={<Button to="/trips/new" icon={Plus}>Plan your first trip</Button>}
        >
          Tell us where you’re going, when, and your budget — we’ll keep everything for the trip together.
        </EmptyState>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-slate-900">My trips</h2>
              <p className="text-sm text-slate-500 mt-1">Everything you’ve planned, in one place.</p>
            </div>
            <Pills
              items={FILTERS.map((f) => ({ ...f, count: counts[f.key] || 0 }))}
              value={filter}
              onChange={setFilter}
            />
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No trips in this category.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 lg:gap-6">
              {visible.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} index={i} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
