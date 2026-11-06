import React from 'react';
import { BedDouble, ExternalLink, MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import ItemsSection from './ItemsSection';
import AccommodationForm from './AccommodationForm';
import useTripItems from './useTripItems';
import Button from '../ui/Button';
import { Badge } from '../ui/Feedback';
import { accommodationsApi } from '../../api/endpoints';
import { ACCOMMODATION_TYPES, labelFor } from '../../constants/options';
import { formatINR, nightsBetween } from '../../utils/format';

function bestIds(items) {
  if (items.length < 2) return {};
  const cheapest = [...items].sort((a, b) => Number(a.price_per_night) - Number(b.price_per_night))[0];
  const rated = items.filter((i) => i.rating != null && i.rating !== '');
  const topRated = [...rated].sort((a, b) => Number(b.rating) - Number(a.rating))[0];
  return { cheapest: cheapest?.id, topRated: topRated?.id };
}

function StayItem({ stay, nights, best, onEdit, onDelete }) {
  const hasRating = stay.rating != null && stay.rating !== '';
  return (
    <div className="rounded-xl ring-1 ring-slate-200 hover:ring-orange-200 hover:shadow-md hover:shadow-slate-900/5 bg-white transition-all">
      <div className="flex items-start gap-3 p-4">
        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
          <BedDouble className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900">{stay.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {stay.location}
            </span>
            <span className="text-slate-400">{labelFor(ACCOMMODATION_TYPES, stay.accommodation_type)}</span>
            {hasRating && (
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {Number(stay.rating).toFixed(1)}
              </span>
            )}
          </div>
          {(best.cheapest === stay.id || best.topRated === stay.id) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {best.cheapest === stay.id && <Badge tone="emerald">Cheapest</Badge>}
              {best.topRated === stay.id && <Badge tone="amber">Top rated</Badge>}
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-slate-900 tabular-nums">{formatINR(stay.price_per_night)}</p>
          <p className="text-xs text-slate-500">per night</p>
          {nights > 0 && (
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              ≈ {formatINR(Number(stay.price_per_night) * nights)} / {nights}N
            </p>
          )}
        </div>
      </div>
      <div className="px-2 py-1.5 border-t border-slate-100 flex items-center justify-end gap-0.5">
        {stay.booking_url && (
          <Button size="sm" variant="ghost" icon={ExternalLink} href={stay.booking_url} className="mr-auto !text-orange-600 hover:!bg-orange-50">
            Book
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={Pencil} onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="ghost-danger" icon={Trash2} onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}

export default function AccommodationSection({ trip }) {
  const state = useTripItems(accommodationsApi, trip.id);
  const best = bestIds(state.items);
  const nights = nightsBetween(trip.start_date, trip.end_date);

  return (
    <ItemsSection
      title="Where to stay"
      icon={BedDouble}
      tint="bg-orange-50 text-orange-600"
      description="Shortlist hotels, hostels and homestays."
      addLabel="Add stay"
      noun="stay"
      emptyText="Add a few hotels or hostels to compare price and rating."
      state={state}
      renderItem={(stay, { onEdit, onDelete }) => (
        <StayItem stay={stay} nights={nights} best={best} onEdit={onEdit} onDelete={onDelete} />
      )}
      renderForm={({ item, onSubmit, onCancel }) => (
        <AccommodationForm trip={trip} stay={item} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  );
}
