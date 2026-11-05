import React, { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Navigation, Users, Wallet } from 'lucide-react';
import { TextField, SelectField } from '../ui/Field';
import { Alert } from '../ui/Feedback';
import Button from '../ui/Button';
import { TRAVEL_MODES } from '../../constants/options';
import { destinationsApi } from '../../api/endpoints';
import { splitFormErrors } from '../../api/client';
import { nightsBetween, todayISO } from '../../utils/format';

const FIELDS = [
  'source',
  'destination',
  'start_date',
  'end_date',
  'number_of_people',
  'estimated_budget',
  'travel_mode',
];

const EMPTY = {
  source: '',
  destination: '',
  start_date: '',
  end_date: '',
  number_of_people: '1',
  estimated_budget: '',
  travel_mode: 'self_vehicle',
};

function fromTrip(trip) {
  if (!trip) return EMPTY;
  return {
    source: trip.source ?? '',
    destination: trip.destination ?? '',
    start_date: trip.start_date ?? '',
    end_date: trip.end_date ?? '',
    number_of_people: String(trip.number_of_people ?? 1),
    estimated_budget: trip.estimated_budget != null ? String(Number(trip.estimated_budget)) : '',
    travel_mode: trip.travel_mode ?? 'self_vehicle',
  };
}

function validate(v, isNew) {
  const e = {};
  if (!v.source.trim()) e.source = 'Where are you starting from?';
  if (!v.destination.trim()) e.destination = 'Where are you going?';
  if (v.source.trim() && v.source.trim().toLowerCase() === v.destination.trim().toLowerCase()) {
    e.destination = 'Destination must be different from the source.';
  }
  if (!v.start_date) e.start_date = 'Pick a start date.';
  else if (isNew && v.start_date < todayISO()) e.start_date = 'Start date cannot be in the past.';
  if (!v.end_date) e.end_date = 'Pick an end date.';
  else if (v.start_date && v.end_date < v.start_date) e.end_date = 'End date must be on or after the start date.';
  const people = Number(v.number_of_people);
  if (!Number.isInteger(people) || people < 1) e.number_of_people = 'At least 1 traveller.';
  const budget = Number(v.estimated_budget);
  if (v.estimated_budget === '' || Number.isNaN(budget) || budget <= 0) e.estimated_budget = 'Enter a budget greater than 0.';
  if (!v.travel_mode) e.travel_mode = 'Choose how you will travel.';
  return e;
}

export default function TripForm({ trip, initialValues, submitLabel, onSubmit, onCancel }) {
  const isNew = !trip;
  const [values, setValues] = useState(() => ({ ...fromTrip(trip), ...initialValues }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [destinationNames, setDestinationNames] = useState([]);

  // Suggest destinations the backend knows about (public endpoint; failures are fine).
  useEffect(() => {
    let alive = true;
    destinationsApi
      .list()
      .then((list) => alive && setDestinationNames(list.map((d) => d.name).filter(Boolean)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validate(values, isNew);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({
        source: values.source.trim(),
        destination: values.destination.trim(),
        start_date: values.start_date,
        end_date: values.end_date,
        number_of_people: Number(values.number_of_people),
        estimated_budget: Number(values.estimated_budget).toFixed(2),
        travel_mode: values.travel_mode,
      });
    } catch (err) {
      const { fieldErrors, formError: msg } = splitFormErrors(err, FIELDS);
      setErrors(fieldErrors);
      setFormError(msg);
      setSaving(false);
    }
  };

  const nights = nightsBetween(values.start_date, values.end_date);
  const showDuration = values.start_date && values.end_date && values.end_date >= values.start_date;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Alert>{formError}</Alert>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Route</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            id="source"
            label="From"
            icon={Navigation}
            placeholder="e.g. Delhi"
            value={values.source}
            onChange={set('source')}
            error={errors.source}
            autoComplete="off"
          />
          <TextField
            id="destination"
            label="To"
            icon={MapPin}
            placeholder="e.g. Manali"
            value={values.destination}
            onChange={set('destination')}
            error={errors.destination}
            list="destination-suggestions"
            autoComplete="off"
          />
          <datalist id="destination-suggestions">
            {destinationNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dates</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            id="start_date"
            label="Start date"
            type="date"
            icon={CalendarDays}
            min={isNew ? todayISO() : undefined}
            value={values.start_date}
            onChange={set('start_date')}
            error={errors.start_date}
          />
          <TextField
            id="end_date"
            label="End date"
            type="date"
            icon={CalendarDays}
            min={values.start_date || (isNew ? todayISO() : undefined)}
            value={values.end_date}
            onChange={set('end_date')}
            error={errors.end_date}
            hint={showDuration ? `${nights + 1} day${nights ? 's' : ''}, ${nights} night${nights === 1 ? '' : 's'}` : undefined}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Travellers & budget</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <TextField
            id="number_of_people"
            label="Travellers"
            type="number"
            min="1"
            step="1"
            icon={Users}
            value={values.number_of_people}
            onChange={set('number_of_people')}
            error={errors.number_of_people}
          />
          <TextField
            id="estimated_budget"
            label="Total budget (₹)"
            type="number"
            min="1"
            step="any"
            icon={Wallet}
            placeholder="20000"
            value={values.estimated_budget}
            onChange={set('estimated_budget')}
            error={errors.estimated_budget}
          />
          <SelectField
            id="travel_mode"
            label="Travel mode"
            options={TRAVEL_MODES}
            value={values.travel_mode}
            onChange={set('travel_mode')}
            error={errors.travel_mode}
          />
        </div>
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
