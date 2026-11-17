import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ExternalLink, MapPin, MapPinned, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/ui/Hero';
import Pills from '../components/ui/Pills';
import { Skeleton, CardGridSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { Alert, Badge, Card, EmptyState } from '../components/ui/Feedback';
import { destinationsApi, placesApi } from '../api/endpoints';
import { placeMeta, mapsUrl } from '../components/destinations/placeMeta';
import { prettify } from '../constants/options';
import { formatDuration, formatINR, titleCase } from '../utils/format';

function PlaceCard({ place }) {
  const { icon: Icon, color } = placeMeta(place.category);
  const cost = Number(place.estimated_cost);
  const url = mapsUrl(place);

  return (
    <Card
      className="p-5 flex flex-col hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all animate-rise"
    >
      <div className="flex items-start gap-3">
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 leading-snug">{place.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{prettify(place.category)}</p>
        </div>
        {cost > 0 && <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatINR(cost)}</span>}
      </div>
      {place.description && <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1">{place.description}</p>}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 60 min is the backend's default for OpenStreetMap places, not a real estimate. */}
          {place.time_required != null && Number(place.time_required) !== 60 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              ~{formatDuration(place.time_required)}
            </span>
          )}
          {!(cost > 0) && <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500">Entry fee not listed</span>}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-800 hover:bg-orange-50 font-medium"
          >
            <MapPin className="w-3.5 h-3.5" /> Map <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </Card>
  );
}

export default function DestinationDetail() {
  const { id } = useParams();
  const [destination, setDestination] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const dest = await destinationsApi.get(id);
        // Use embedded places when the serializer includes them; otherwise fetch them.
        const list = Array.isArray(dest.places)
          ? dest.places
          : (await placesApi.list({ destination: id })).filter((p) => String(p.destination) === String(id));
        if (!alive) return;
        setDestination(dest);
        setPlaces(list);
      } catch (err) {
        if (alive) setError(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const categories = useMemo(() => {
    const counts = {};
    places.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [places]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[30rem] !rounded-[2rem]" />
        <CardGridSkeleton />
      </div>
    );
  }
  if (error) {
    return error.status === 404 ? (
      <EmptyState icon={MapPinned} title="Destination not found" action={<Button to="/destinations">All destinations</Button>} />
    ) : (
      <Alert>{error.message}</Alert>
    );
  }

  const visible = category === 'all' ? places : places.filter((p) => p.category === category);
  // Visit times from OpenStreetMap are a 60-minute default, so we don't add
  // them up. Show counts that are actually known instead.
  const EAT = ['restaurant', 'cafe'];
  const eatCount = places.filter((p) => EAT.includes(String(p.category).toLowerCase())).length;
  const sightCount = places.length - eatCount;
  const stats = [
    { value: sightCount, label: sightCount === 1 ? 'sightseeing spot' : 'sightseeing spots' },
    { value: eatCount, label: eatCount === 1 ? 'place to eat' : 'places to eat' },
    { value: categories.length, label: categories.length === 1 ? 'category' : 'categories' },
  ];

  return (
    <div className="space-y-8">
      <Hero name={destination.name} state={destination.state} minHeight="min-h-[24rem] sm:min-h-[30rem]">
        <div className="flex-1 flex flex-col justify-between gap-8">
          <Link to="/destinations" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            All destinations
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="w-4 h-4" />
                {[destination.state, destination.country].filter(Boolean).join(', ')}
              </p>
              <h1 className="mt-1 font-serif text-5xl sm:text-7xl font-semibold tracking-tight text-shadow">{titleCase(destination.name)}</h1>
              {destination.description && <p className="mt-3 text-white/85 text-lg">{destination.description}</p>}
              {places.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {stats.map((s) => (
                    <div key={s.label} className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-inset ring-white/20">
                      <p className="text-xl font-bold tabular-nums">{s.value}</p>
                      <p className="text-xs text-white/70">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="accent" icon={Plus} to={`/trips/new?destination=${encodeURIComponent(destination.name)}`} className="self-start lg:self-auto">
              Plan a trip here
            </Button>
          </div>
        </div>
      </Hero>

      {places.length === 0 ? (
        <EmptyState icon={MapPinned} title="No places listed yet">
          Places for {titleCase(destination.name)} will show up here once they’re added.
        </EmptyState>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-serif text-3xl font-semibold text-slate-900">Things to do</h2>
            <Pills
              items={[
                { key: 'all', label: 'All', count: places.length },
                ...categories.map(([key, count]) => ({ key, label: prettify(key), count })),
              ]}
              value={category}
              onChange={setCategory}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-5">
            {visible.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
