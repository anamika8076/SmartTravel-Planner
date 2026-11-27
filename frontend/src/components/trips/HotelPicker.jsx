import React, { useEffect, useState } from 'react';
import { BedDouble, Check, ExternalLink, MapPin, Phone, Plus } from 'lucide-react';
import { Alert, Badge } from '../ui/Feedback';
import { ListSkeleton } from '../ui/Skeleton';
import Button from '../ui/Button';
import { accommodationsApi, hotelsApi } from '../../api/endpoints';
import { prettify } from '../../constants/options';

/** Normalises saved OSM hotels and planner recommendations. */
export function normalizeHotel(hotel) {
  const address = hotel.address || {};
  const parts = [
    hotel.street ?? address.street,
    hotel.city ?? address.city,
    hotel.postcode ?? address.postcode,
  ].filter(Boolean);
  return {
    id: hotel.id,
    name: hotel.name,
    category: hotel.category,
    address: parts.join(', '),
    website: hotel.website || '',
    phone: hotel.phone || '',
    latitude: hotel.latitude ?? null,
    longitude: hotel.longitude ?? null,
    nearestSightseeingDistance: hotel.nearest_sightseeing_distance_km ?? null,
    nearestSightseeingPlace: hotel.nearest_sightseeing_place || '',
  };
}

function HotelRow({ hotel, tripId, onAdd, added }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [rating, setRating] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const nightlyPrice = Number(price);
    if (!price || !Number.isFinite(nightlyPrice) || nightlyPrice <= 0) {
      setError('Enter the nightly price you were quoted.');
      return;
    }
    const numericRating = rating === '' ? null : Number(rating);
    if (
      numericRating !== null
      && (!Number.isFinite(numericRating) || numericRating < 0 || numericRating > 5)
    ) {
      setError('Rating must be between 0 and 5.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onAdd({
        trip: tripId,
        hotel: hotel.id,
        price_per_night: nightlyPrice.toFixed(2),
        rating: numericRating === null ? null : numericRating.toFixed(2),
      }, hotel);
      setOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-2xl p-3.5 ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <BedDouble className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{hotel.name}</p>
          <p className="text-xs text-slate-500">{prettify(hotel.category) || 'Stay'} · OpenStreetMap</p>
          {hotel.address && (
            <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
              <MapPin className="mt-px h-3.5 w-3.5 flex-shrink-0" /> {hotel.address}
            </p>
          )}
          {hotel.nearestSightseeingDistance != null && (
            <p className="mt-1 text-xs text-slate-500">
              About {Number(hotel.nearestSightseeingDistance).toFixed(1)} km straight-line to the nearest planned stop
              {hotel.nearestSightseeingPlace ? ` (${hotel.nearestSightseeingPlace})` : ''}.
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {hotel.website && (
              <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-orange-600 hover:underline">
                Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {hotel.phone && (
              <a href={`tel:${hotel.phone}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
                <Phone className="h-3 w-3" /> {hotel.phone}
              </a>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">Availability and prices are not provided by OpenStreetMap.</p>
        </div>
        <div className="flex-shrink-0">
          {added ? (
            <Badge tone="emerald"><Check className="h-3 w-3" /> Added</Badge>
          ) : !open ? (
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => setOpen(true)}>
              Add
            </Button>
          ) : null}
        </div>
      </div>
      {open && !added && (
        <form onSubmit={submit} noValidate className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <label htmlFor={`price-${hotel.id}`} className="block text-xs font-medium text-slate-700">
            Quoted price per night (₹); optional rating is out of 5
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              id={`price-${hotel.id}`}
              type="number"
              min="1"
              step="any"
              autoFocus
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setError('');
              }}
              placeholder="e.g. 2500"
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
            />
            <input
              aria-label={`Optional user-checked rating for ${hotel.name}`}
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={rating}
              onChange={(event) => {
                setRating(event.target.value);
                setError('');
              }}
              placeholder="Rating / 5 (optional)"
              className="min-w-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" size="sm" loading={saving}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </form>
      )}
    </li>
  );
}

/** Lists free OpenStreetMap hotel entries; prices must be checked externally. */
export default function HotelPicker({
  tripId,
  destination,
  hotels: given,
  onAdd,
  emptyText,
  onManual,
}) {
  const [hotels, setHotels] = useState(given ? given.map(normalizeHotel) : null);
  const [searchUrl, setSearchUrl] = useState('');
  const [error, setError] = useState('');
  const [added, setAdded] = useState({});
  const [savedNames, setSavedNames] = useState(new Set());
  const [shown, setShown] = useState(8);

  useEffect(() => {
    if (!tripId) return undefined;
    let active = true;
    accommodationsApi.list()
      .then((list) => {
        if (!active) return;
        const mine = list.filter((item) => String(item.trip) === String(tripId));
        setAdded((current) => {
          const next = { ...current };
          mine.forEach((item) => item.hotel && (next[item.hotel] = true));
          return next;
        });
        setSavedNames(new Set(mine.map((item) => String(item.name || '').trim().toLowerCase())));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tripId]);

  useEffect(() => {
    if (given) return undefined;
    let active = true;
    hotelsApi.search(destination, { tripId })
      .then((data) => {
        if (!active) return;
        setHotels((data.hotels || []).map(normalizeHotel));
        setSearchUrl(data.search_url || '');
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message);
        setHotels([]);
      });
    return () => {
      active = false;
    };
  }, [given, destination, tripId]);

  const handleAdd = async (body, hotel) => {
    await onAdd(body);
    if (hotel?.id != null) setAdded((current) => ({ ...current, [hotel.id]: true }));
    if (hotel?.name) {
      setSavedNames((current) => new Set([...current, hotel.name.trim().toLowerCase()]));
    }
  };

  if (!hotels) return <ListSkeleton rows={3} />;

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-emerald-50 px-3.5 py-3 text-xs leading-relaxed text-emerald-900">
        This app uses free OpenStreetMap listings and does not call paid hotel APIs. Listings do not include live availability or prices.
      </div>
      {searchUrl && (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Check current hotel prices <ExternalLink className="h-4 w-4" />
        </a>
      )}
      {error && <Alert>{error}</Alert>}
      {hotels.length === 0 ? (
        <div className="py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <BedDouble className="h-6 w-6" />
          </div>
          <p className="mt-3 font-semibold text-slate-900">No hotels found</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
            {emptyText || `No OpenStreetMap hotels are saved for ${destination}.`}
          </p>
          {onManual && (
            <Button size="sm" icon={Plus} onClick={onManual} className="mt-4">
              Add your own stay
            </Button>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {hotels.slice(0, shown).map((hotel, index) => (
              <HotelRow
                key={hotel.id ?? `${hotel.name}-${index}`}
                hotel={hotel}
                tripId={tripId}
                onAdd={handleAdd}
                added={added[hotel.id] || savedNames.has(String(hotel.name || '').trim().toLowerCase())}
              />
            ))}
          </ul>
          {hotels.length > shown && (
            <button
              type="button"
              onClick={() => setShown((count) => count + 12)}
              className="w-full rounded-2xl bg-stone-100 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
            >
              Show more hotels ({hotels.length - shown} more)
            </button>
          )}
        </>
      )}
    </div>
  );
}
