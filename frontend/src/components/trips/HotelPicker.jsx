import React, { useEffect, useState } from 'react';
import { BedDouble, Check, ExternalLink, MapPin, Phone, Plus } from 'lucide-react';
import { Alert, Badge } from '../ui/Feedback';
import { ListSkeleton } from '../ui/Skeleton';
import Button from '../ui/Button';
import { accommodationsApi, hotelsApi } from '../../api/endpoints';
import { prettify } from '../../constants/options';

/** Normalises hotels from /hotels/search/ (nested address) and planner recommendations (flat). */
export function normalizeHotel(h) {
  const address = h.address || {};
  const parts = [h.street ?? address.street, h.city ?? address.city, h.postcode ?? address.postcode].filter(Boolean);
  return {
    id: h.id,
    name: h.name,
    category: h.category,
    address: parts.join(', '),
    website: h.website || '',
    phone: h.phone || '',
  };
}

function HotelRow({ hotel, tripId, onAdd, added }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(price);
    if (!price || Number.isNaN(n) || n <= 0) {
      setError('Enter the nightly price you were quoted.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onAdd({ trip: tripId, hotel: hotel.id, price_per_night: n.toFixed(2) });
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-2xl ring-1 ring-slate-200 p-3.5">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
          <BedDouble className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900">{hotel.name}</p>
          <p className="text-xs text-slate-500">{prettify(hotel.category) || 'Stay'}</p>
          {hotel.address && (
            <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-px" /> {hotel.address}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {hotel.website && (
              <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-orange-600 font-medium hover:underline">
                Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {hotel.phone && (
              <a href={`tel:${hotel.phone}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
                <Phone className="w-3 h-3" /> {hotel.phone}
              </a>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {added ? (
            <Badge tone="emerald"><Check className="w-3 h-3" /> Added</Badge>
          ) : (
            !open && (
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => setOpen(true)}>
                Add
              </Button>
            )
          )}
        </div>
      </div>
      {open && !added && (
        <form onSubmit={submit} noValidate className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <label htmlFor={`price-${hotel.id}`} className="block text-xs font-medium text-slate-700">
            Price per night you were quoted (₹)
          </label>
          <div className="flex gap-2">
            <input
              id={`price-${hotel.id}`}
              type="number"
              min="1"
              step="any"
              autoFocus
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 2500"
              className="flex-1 min-w-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
            />
            <Button type="submit" size="sm" loading={saving}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </form>
      )}
    </li>
  );
}

/**
 * Lists hotels saved from OpenStreetMap. They have no prices, so adding one
 * asks for the nightly price the traveller was actually quoted.
 * Pass `hotels` to show a given list, or omit it to fetch by `destination`.
 */
export default function HotelPicker({ tripId, destination, hotels: given, onAdd, emptyText, onManual }) {
  const [hotels, setHotels] = useState(given ? given.map(normalizeHotel) : null);
  const [error, setError] = useState('');
  const [added, setAdded] = useState({});
  const [savedNames, setSavedNames] = useState(new Set());

  // Mark hotels already saved on this trip (by hotel id, or by name for manual stays).
  useEffect(() => {
    if (!tripId) return undefined;
    let alive = true;
    accommodationsApi
      .list()
      .then((list) => {
        if (!alive) return;
        const mine = list.filter((a) => String(a.trip) === String(tripId));
        setAdded((prev) => {
          const next = { ...prev };
          mine.forEach((a) => a.hotel && (next[a.hotel] = true));
          return next;
        });
        setSavedNames(new Set(mine.map((a) => String(a.name || '').trim().toLowerCase())));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tripId]);
  const [shown, setShown] = useState(8);

  useEffect(() => {
    if (given) return undefined;
    let alive = true;
    hotelsApi
      .search(destination)
      .then((data) => alive && setHotels((data?.hotels || []).map(normalizeHotel)))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [given, destination]);

  const handleAdd = async (body) => {
    await onAdd(body);
    setAdded((a) => ({ ...a, [body.hotel]: true }));
  };

  if (error) return <Alert>{error}</Alert>;
  if (!hotels) return <ListSkeleton rows={3} />;
  if (hotels.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
          <BedDouble className="w-6 h-6" />
        </div>
        <p className="mt-3 font-semibold text-slate-900">No hotels found</p>
        <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
          {emptyText || `No hotels are saved for ${destination} yet. You can add the place you’re staying at yourself.`}
        </p>
        {onManual && (
          <Button size="sm" icon={Plus} onClick={onManual} className="mt-4">Add your own stay</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {hotels.slice(0, shown).map((h) => (
          <HotelRow key={h.id} hotel={h} tripId={tripId} onAdd={handleAdd} added={added[h.id] || savedNames.has(String(h.name || '').trim().toLowerCase())} />
        ))}
      </ul>
      {hotels.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + 12)}
          className="w-full py-2.5 rounded-2xl text-sm font-medium text-slate-600 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 transition-colors"
        >
          Show more hotels ({hotels.length - shown} more)
        </button>
      )}
    </div>
  );
}
