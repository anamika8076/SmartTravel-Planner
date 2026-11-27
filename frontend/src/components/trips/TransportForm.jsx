import React, { useState } from 'react';
import { TextField, SelectField } from '../ui/Field';
import { Alert } from '../ui/Feedback';
import Button from '../ui/Button';
import { TRANSPORT_TYPES } from '../../constants/options';
import { splitFormErrors } from '../../api/client';
import { fromDateTimeInput, toDateTimeInput } from '../../utils/format';

const FIELDS = ['direction', 'transport_type', 'provider', 'origin', 'destination', 'departure_time', 'arrival_time', 'estimated_cost', 'booking_url'];

const DIRECTIONS = [
  { value: 'outbound', label: 'Getting there' },
  { value: 'return', label: 'Coming back' },
];

function initial(option, trip, defaultTransportType, defaultDirection) {
  const direction = option?.direction ?? defaultDirection ?? 'outbound';
  const back = direction === 'return';
  const day = back ? trip.end_date : trip.start_date;
  return {
    direction,
    transport_type: option?.transport_type ?? defaultTransportType ?? 'bus',
    provider: option?.provider ?? '',
    origin: option?.origin ?? (back ? trip.destination : trip.source) ?? '',
    destination: option?.destination ?? (back ? trip.source : trip.destination) ?? '',
    departure_time: toDateTimeInput(option?.departure_time) || (day ? `${day}T${back ? '18' : '08'}:00` : ''),
    arrival_time: toDateTimeInput(option?.arrival_time),
    estimated_cost: option?.estimated_cost != null ? String(Number(option.estimated_cost)) : '',
    booking_url: option?.booking_url ?? '',
  };
}

function validate(v, requirePositiveCost, requiredDepartureDate) {
  const e = {};
  if (!v.transport_type) e.transport_type = 'Choose a type.';
  if (!v.origin.trim()) e.origin = 'Required.';
  if (!v.destination.trim()) e.destination = 'Required.';
  if (!v.departure_time) e.departure_time = 'Required.';
  else if (
    requiredDepartureDate
    && v.direction !== 'return'
    && v.departure_time.slice(0, 10) !== requiredDepartureDate
  ) {
    e.departure_time = `Use the trip start date (${requiredDepartureDate}).`;
  }
  if (!v.arrival_time) e.arrival_time = 'Required.';
  else if (v.departure_time && v.arrival_time <= v.departure_time) e.arrival_time = 'Arrival must be after departure.';
  const cost = Number(v.estimated_cost);
  if (
    v.estimated_cost === ''
    || !Number.isFinite(cost)
    || cost < (requirePositiveCost ? 0.01 : 0)
  ) {
    e.estimated_cost = requirePositiveCost
      ? 'Enter a quoted amount greater than 0.'
      : 'Enter a cost (0 or more).';
  }
  if (v.booking_url && !/^https?:\/\/\S+$/i.test(v.booking_url.trim())) e.booking_url = 'Enter a full link starting with http(s)://';
  return e;
}

export default function TransportForm({
  trip,
  option,
  onSubmit,
  onCancel,
  defaultTransportType,
  fixedTransportType = false,
  requirePositiveCost = false,
  costHint,
  requiredDepartureDate,
  defaultDirection,
}) {
  const [values, setValues] = useState(() => initial(option, trip, defaultTransportType, defaultDirection));
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
    const found = validate(
      values,
      requirePositiveCost,
      requiredDepartureDate,
    );
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({
        trip: trip.id,
        direction: values.direction,
        transport_type: values.transport_type,
        provider: values.provider.trim(),
        origin: values.origin.trim(),
        destination: values.destination.trim(),
        departure_time: fromDateTimeInput(values.departure_time),
        arrival_time: fromDateTimeInput(values.arrival_time),
        estimated_cost: Number(values.estimated_cost).toFixed(2),
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
      <div className="grid grid-cols-2 gap-4">
        <SelectField id="direction" label="Leg" options={DIRECTIONS} value={values.direction} onChange={set('direction')} error={errors.direction} />
        {!fixedTransportType && (
          <SelectField id="transport_type" label="Type" options={TRANSPORT_TYPES} value={values.transport_type} onChange={set('transport_type')} error={errors.transport_type} />
        )}
        <TextField id="provider" label="Provider" placeholder="e.g. HRTC, IndiGo" value={values.provider} onChange={set('provider')} error={errors.provider} />
        <TextField id="origin" label="From" value={values.origin} onChange={set('origin')} error={errors.origin} />
        <TextField id="destination" label="To" value={values.destination} onChange={set('destination')} error={errors.destination} />
        <TextField id="departure_time" label="Departure" type="datetime-local" value={values.departure_time} onChange={set('departure_time')} error={errors.departure_time} />
        <TextField id="arrival_time" label="Arrival" type="datetime-local" min={values.departure_time || undefined} value={values.arrival_time} onChange={set('arrival_time')} error={errors.arrival_time} />
        <TextField id="estimated_cost" label="Estimated cost (₹)" type="number" min={requirePositiveCost ? '0.01' : '0'} step="any" value={values.estimated_cost} onChange={set('estimated_cost')} error={errors.estimated_cost} hint={costHint} />
        <TextField id="booking_url" label="Booking link" type="url" placeholder="https://…" value={values.booking_url} onChange={set('booking_url')} error={errors.booking_url} hint="Optional" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>{option ? 'Save changes' : 'Add option'}</Button>
      </div>
    </form>
  );
}
