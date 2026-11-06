// Choice values sent to the backend. These must match the `choices` on the
// Django models in Travel-app-backend — the value is what gets stored:
//   Trip.TRAVEL_MODE_CHOICES, TransportOption.TRANSPORT_TYPES,
//   Accommodation.ACCOMMODATION_TYPES (trips/models.py)

export const TRAVEL_MODES = [
  { value: 'self_vehicle', label: 'Self vehicle' },
  { value: 'rented_vehicle', label: 'Rented vehicle' },
  { value: 'public_transport', label: 'Public transport' },
  { value: 'any', label: 'Any mode' },
];

export const TRANSPORT_TYPES = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
];

export const ACCOMMODATION_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'resort', label: 'Resort' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'guesthouse', label: 'Guesthouse' },
];

export function labelFor(options, value) {
  const match = options.find((o) => o.value === value);
  if (match) return match.label;
  return prettify(value);
}

export function prettify(value) {
  if (!value) return '';
  const text = String(value).replace(/[_-]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
