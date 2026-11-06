import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, MapPinned, RotateCw, Search, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Hero from '../components/ui/Hero';
import Photo from '../components/ui/Photo';
import { Alert, EmptyState } from '../components/ui/Feedback';
import { Skeleton } from '../components/ui/Skeleton';
import { destinationsApi } from '../api/endpoints';
import { PHOTOS } from '../utils/visuals';

function DestinationCard({ d, index, featured }) {
  const count = Array.isArray(d.places) ? d.places.length : null;
  return (
    <Link
      to={`/destinations/${d.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className={`group relative block overflow-hidden rounded-3xl text-white shadow-sm hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all duration-300 animate-rise ${
        featured ? 'sm:col-span-2 sm:row-span-2 min-h-[22rem] sm:min-h-0' : 'min-h-[18rem]'
      }`}
    >
      <Photo
        name={d.name}
        extra={`${d.state || ''} ${d.description || ''}`}
        width={featured ? 1000 : 600}
        height={featured ? 900 : 600}
        imgClassName="group-hover:scale-105 !transition-[transform,opacity] !duration-700"
      />
      <div className="relative h-full p-5 sm:p-6 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          {count != null ? (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-[11px] font-semibold">
              {count} {count === 1 ? 'place' : 'places'} to explore
            </span>
          ) : (
            <span />
          )}
          <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 group-hover:rotate-45 transition-all duration-300">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs font-medium text-white/85">
            <MapPin className="w-3.5 h-3.5" />
            {[d.state, d.country].filter(Boolean).join(', ')}
          </p>
          <h3 className={`font-serif font-semibold text-shadow ${featured ? 'text-4xl sm:text-5xl' : 'text-3xl'}`}>{d.name}</h3>
          {d.description && (
            <p className={`mt-1 text-sm text-white/85 ${featured ? 'max-w-md' : 'line-clamp-2'}`}>{d.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

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
    <div className="space-y-10">
      <Hero src={PHOTOS.cloudPeaks} name="explore">
        <div className="flex-1 flex flex-col justify-end max-w-2xl">
          <span className="self-start px-3 py-1 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/25 text-xs font-semibold uppercase tracking-wider">
            Explore India
          </span>
          <h1 className="mt-4 font-serif text-5xl sm:text-6xl font-semibold tracking-tight text-shadow">
            Find your next <span className="italic text-orange-300">favourite place</span>
          </h1>
          <p className="mt-3 text-white/85 max-w-lg text-lg">
            Attractions, cafés and stays — with how long each takes and what it costs.
          </p>
          <div className="mt-7 relative max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Manali, Goa, Rajasthan…"
              aria-label="Search destinations"
              className="w-full rounded-full bg-white py-4 pl-14 pr-12 text-base text-slate-900 placeholder:text-slate-400 shadow-2xl shadow-black/30 focus:outline-none focus:ring-4 focus:ring-orange-400/50 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Hero>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 auto-rows-[18rem] gap-5">
          <Skeleton className="!rounded-3xl sm:col-span-2 sm:row-span-2" />
          <Skeleton className="!rounded-3xl" />
          <Skeleton className="!rounded-3xl" />
        </div>
      ) : error ? (
        <Alert action={<Button size="sm" variant="secondary" icon={RotateCw} onClick={load}>Retry</Button>}>{error}</Alert>
      ) : destinations.length === 0 ? (
        <EmptyState icon={MapPinned} title="No destinations yet">
          Destinations added in the backend will appear here.
        </EmptyState>
      ) : (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-slate-900">
                {query ? 'Search results' : 'Popular destinations'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {filtered.length} of {destinations.length} destinations
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matches" action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>}>
              Nothing matches “{query}”. Try a city or state name.
            </EmptyState>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 sm:auto-rows-[18rem] 2xl:auto-rows-[22rem] gap-5 lg:gap-6">
              {filtered.map((d, i) => (
                <DestinationCard key={d.id} d={d} index={i} featured={i === 0 && filtered.length % 3 === 0} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
