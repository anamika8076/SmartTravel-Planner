import { BedDouble, Coffee, Footprints, Landmark, MapPin, Mountain, ShoppingBag, UtensilsCrossed } from 'lucide-react';

const META = [
  { match: ['cafe', 'café', 'coffee'], icon: Coffee, color: 'bg-amber-50 text-amber-600' },
  { match: ['restaurant', 'food', 'dining'], icon: UtensilsCrossed, color: 'bg-orange-50 text-orange-600' },
  { match: ['hotel', 'hostel', 'stay', 'homestay', 'accommodation'], icon: BedDouble, color: 'bg-violet-50 text-violet-600' },
  { match: ['shop', 'market'], icon: ShoppingBag, color: 'bg-pink-50 text-pink-600' },
  { match: ['trek', 'hike', 'adventure'], icon: Footprints, color: 'bg-emerald-50 text-emerald-600' },
  { match: ['view', 'nature', 'valley', 'mountain', 'falls'], icon: Mountain, color: 'bg-sky-50 text-sky-600' },
  { match: ['attraction', 'temple', 'monument', 'heritage', 'museum'], icon: Landmark, color: 'bg-teal-50 text-teal-600' },
];

export function placeMeta(category) {
  const c = String(category || '').toLowerCase();
  return META.find((m) => m.match.some((k) => c.includes(k))) || { icon: MapPin, color: 'bg-slate-100 text-slate-600' };
}

export function mapsUrl(place) {
  if (place.latitude != null && place.longitude != null && place.latitude !== '' && place.longitude !== '') {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }
  return null;
}
