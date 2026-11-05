import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, ExternalLink, IndianRupee, MapPinned, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Alert, Card, EmptyState, Spinner } from '../components/ui/Feedback';
import { destinationsApi, placesApi } from '../api/endpoints';
import { placeMeta, mapsUrl } from '../components/destinations/placeMeta';
import { prettify } from '../constants/options';
import { formatDuration, formatINR } from '../utils/format';

function PlaceCard({ place }) {
  const { icon: Icon, color } = placeMeta(place.category);
  const cost = Number(place.estimated_cost);
  const url = mapsUrl(place);

  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-start gap-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{place.name}</h3>
          <p className="text-xs text-slate-500">{prettify(place.category)}</p>
        </div>
      </div>
      {place.description && <p className="mt-3 text-sm text-slate-600 flex-1">{place.description}</p>}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          {place.time_required != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatDuration(place.time_required)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
            {cost > 0 ? formatINR(cost).replace('₹', '') : 'Free'}
          </span>
        </div>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-700 hover:underline font-medium">
            Map <ExternalLink className="w-3 h-3" />
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

  if (loading) return <Spinner label="Loading destination…" />;
  if (error) {
    return error.status === 404 ? (
      <EmptyState icon={MapPinned} title="Destination not found" action={<Button to="/destinations">All destinations</Button>} />
    ) : (
      <Alert>{error.message}</Alert>
    );
  }

  const visible = category === 'all' ? places : places.filter((p) => p.category === category);
  const totalMinutes = places.reduce((sum, p) => sum + (Number(p.time_required) || 0), 0);

  return (
    <>
      <PageHeader
        back={{ to: '/destinations', label: 'All destinations' }}
        eyebrow={[destination.state, destination.country].filter(Boolean).join(', ')}
        title={destination.name}
        subtitle={destination.description}
        actions={
          <Button icon={Plus} to={`/trips/new?destination=${encodeURIComponent(destination.name)}`}>
            Plan a trip here
          </Button>
        }
      />

      {places.length === 0 ? (
        <EmptyState icon={MapPinned} title="No places listed yet">
          Places for {destination.name} will show up here once they’re added.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {[['all', places.length], ...categories].map(([key, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    category === key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {key === 'all' ? 'All' : prettify(key)}
                  <span className={`ml-1.5 ${category === key ? 'text-white/60' : 'text-slate-400'}`}>{count}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 flex-shrink-0">
              {places.length} places · about {formatDuration(totalMinutes)} to see everything
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
