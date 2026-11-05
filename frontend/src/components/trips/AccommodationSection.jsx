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
    <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <BedDouble className="w-[18px] h-[18px]" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900">{stay.name}</span>
            <Badge>{labelFor(ACCOMMODATION_TYPES, stay.accommodation_type)}</Badge>
            {best.cheapest === stay.id && <Badge tone="emerald">Cheapest</Badge>}
            {best.topRated === stay.id && <Badge tone="amber">Top rated</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {stay.location}
            </span>
            {hasRating && (
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {Number(stay.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-slate-900">{formatINR(stay.price_per_night)}</p>
          <p className="text-xs text-slate-500">per night</p>
          {nights > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              ≈ {formatINR(Number(stay.price_per_night) * nights)} / {nights}N
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
        {stay.booking_url && (
          <Button size="sm" variant="ghost" icon={ExternalLink} href={stay.booking_url}>
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
      description="Shortlist hotels, hostels and homestays."
      addLabel="Add stay"
      noun="stay"
      emptyText="No stays yet. Add a few options to compare price and rating."
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
