import React, { useEffect, useMemo, useState } from 'react';
import { Luggage, Plus, RotateCw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Alert, EmptyState, Spinner } from '../components/ui/Feedback';
import TripCard from '../components/trips/TripCard';
import { tripsApi } from '../api/endpoints';
import { tripStatus } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'On the road' },
  { key: 'completed', label: 'Completed' },
];

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

  const visible = filter === 'all' ? withStatus : withStatus.filter((t) => t._status === filter);

  return (
    <>
      <PageHeader
        eyebrow={user?.username ? `Hi, ${user.username}` : undefined}
        title="My trips"
        subtitle="All your planned journeys in one place."
        actions={<Button to="/trips/new" icon={Plus}>Plan a new trip</Button>}
      />

      {loading ? (
        <Spinner label="Loading your trips…" />
      ) : error ? (
        <Alert action={<Button size="sm" variant="secondary" icon={RotateCw} onClick={load}>Retry</Button>}>{error}</Alert>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title="No trips yet"
          action={<Button to="/trips/new" icon={Plus}>Plan your first trip</Button>}
        >
          Tell us where you’re going, when, and your budget — we’ll keep everything for the trip together.
        </EmptyState>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {f.label}
                <span className={`ml-1.5 ${filter === f.key ? 'text-white/60' : 'text-slate-400'}`}>{counts[f.key] || 0}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No trips in this category.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
