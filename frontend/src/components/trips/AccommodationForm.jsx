import React, { useState } from 'react';
import { TextField, SelectField } from '../ui/Field';
import { Alert } from '../ui/Feedback';
import Button from '../ui/Button';
import { ACCOMMODATION_TYPES } from '../../constants/options';
import { splitFormErrors } from '../../api/client';

const FIELDS = ['name', 'accommodation_type', 'location', 'price_per_night', 'rating', 'booking_url'];

function initial(stay) {
  return {
    name: stay?.name ?? '',
    accommodation_type: stay?.accommodation_type ?? 'hotel',
    location: stay?.location ?? '',
    price_per_night: stay?.price_per_night != null ? String(Number(stay.price_per_night)) : '',
    rating: stay?.rating != null ? String(Number(stay.rating)) : '',
    booking_url: stay?.booking_url ?? '',
  };
}

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = 'Required.';
  if (!v.accommodation_type) e.accommodation_type = 'Choose a type.';
  if (!v.location.trim()) e.location = 'Required.';
  const price = Number(v.price_per_night);
  if (v.price_per_night === '' || Number.isNaN(price) || price < 0) e.price_per_night = 'Enter a price (0 or more).';
  if (v.rating !== '') {
    const r = Number(v.rating);
    if (Number.isNaN(r) || r < 0 || r > 5) e.rating = 'Rating must be between 0 and 5.';
  }
  if (v.booking_url && !/^https?:\/\/\S+$/i.test(v.booking_url.trim())) e.booking_url = 'Enter a full link starting with http(s)://';
  return e;
}

export default function AccommodationForm({ trip, stay, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initial(stay));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({
        trip: trip.id,
        name: values.name.trim(),
        accommodation_type: values.accommodation_type,
        location: values.location.trim(),
        price_per_night: Number(values.price_per_night).toFixed(2),
        rating: values.rating === '' ? null : Number(values.rating).toFixed(2),
        booking_url: values.booking_url.trim(),
      });
    } catch (err) {
      const { fieldErrors, formError: msg } = splitFormErrors(err, FIELDS);
      setErrors(fieldErrors);
      setFormError(msg);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Alert>{formError}</Alert>
      <TextField id="name" label="Name" placeholder="e.g. Manali Mountain Hotel" value={values.name} onChange={set('name')} error={errors.name} />
      <div className="grid grid-cols-2 gap-4">
        <SelectField id="accommodation_type" label="Type" options={ACCOMMODATION_TYPES} value={values.accommodation_type} onChange={set('accommodation_type')} error={errors.accommodation_type} />
        <TextField id="location" label="Location" placeholder="e.g. Old Manali" value={values.location} onChange={set('location')} error={errors.location} />
        <TextField id="price_per_night" label="Price / night (₹)" type="number" min="0" step="any" value={values.price_per_night} onChange={set('price_per_night')} error={errors.price_per_night} />
        <TextField id="rating" label="Rating (0–5)" type="number" min="0" max="5" step="0.1" value={values.rating} onChange={set('rating')} error={errors.rating} hint="Optional" />
      </div>
      <TextField id="booking_url" label="Booking link" type="url" placeholder="https://…" value={values.booking_url} onChange={set('booking_url')} error={errors.booking_url} hint="Optional" />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>{stay ? 'Save changes' : 'Add stay'}</Button>
      </div>
    </form>
  );
}
