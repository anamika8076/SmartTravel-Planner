import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPinned, RotateCw, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Alert, EmptyState, Spinner } from '../components/ui/Feedback';
import { TextField } from '../components/ui/Field';
import { destinationsApi } from '../api/endpoints';

const GRADIENTS = [
  'from-teal-500 to-sky-600',
  'from-orange-400 to-rose-500',
  'from-violet-500 to-fuchsia-500',
  'from-emerald-500 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-sky-500 to-indigo-500',
];

export default function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setDestinations(await destinationsApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((d) =>
      [d.name, d.state, d.country, d.description].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [destinations, query]);

  return (
    <>
      <PageHeader
        title="Explore destinations"
        subtitle="Attractions, cafés and stays curated for each place."
        actions={
          <div className="w-full sm:w-72">
            <TextField id="search" icon={Search} placeholder="Search by name or state" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }
      />

      {loading ? (
        <Spinner label="Loading destinations…" />
      ) : error ? (
        <Alert action={<Button size="sm" variant="secondary" icon={RotateCw} onClick={load}>Retry</Button>}>{error}</Alert>
      ) : destinations.length === 0 ? (
        <EmptyState icon={MapPinned} title="No destinations yet">
          Destinations added in the backend will appear here.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-12">No destinations match “{query}”.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d, i) => (
            <Link
              key={d.id}
              to={`/destinations/${d.id}`}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`h-28 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} relative p-4 flex items-end`}>
                <ArrowUpRight className="absolute top-4 right-4 w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                <h3 className="font-serif text-2xl font-semibold text-white drop-shadow-sm">{d.name}</h3>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-slate-500">{[d.state, d.country].filter(Boolean).join(', ')}</p>
                {d.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{d.description}</p>}
                {Array.isArray(d.places) && (
                  <p className="mt-3 text-xs font-medium text-teal-700">
                    {d.places.length} place{d.places.length === 1 ? '' : 's'} to explore
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
