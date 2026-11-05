// Choice values sent to the backend. Keep these in sync with the
// `choices` on the Django models — the value is what gets stored.

export const TRAVEL_MODES = [
  { value: 'self_vehicle', label: 'Self vehicle' },
  { value: 'rented_vehicle', label: 'Rented vehicle' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'flight', label: 'Flight' },
];

export const TRANSPORT_TYPES = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' },
  { value: 'taxi', label: 'Taxi' },
];

export const ACCOMMODATION_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'resort', label: 'Resort' },
  { value: 'apartment', label: 'Apartment' },
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
