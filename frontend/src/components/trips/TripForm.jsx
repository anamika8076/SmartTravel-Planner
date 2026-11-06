import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Minus, Navigation, Plus, Wallet } from 'lucide-react';
import { TextField } from '../ui/Field';
import { Alert } from '../ui/Feedback';
import Button from '../ui/Button';
import { TRAVEL_MODES } from '../../constants/options';
import { destinationsApi } from '../../api/endpoints';
import { splitFormErrors } from '../../api/client';
import { formatINR, nightsBetween, todayISO } from '../../utils/format';
import { travelModeIcon } from './travelModes';
import Photo from '../ui/Photo';
import { PHOTOS } from '../../utils/visuals';

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

function TripPreview({ values }) {
  const validDates = values.start_date && values.end_date && values.end_date >= values.start_date;
  const nights = validDates ? nightsBetween(values.start_date, values.end_date) : 0;
  const days = nights + 1;
  const people = Math.max(1, Number(values.number_of_people) || 1);
  const budget = Number(values.estimated_budget) || 0;

  const items = [
    { label: 'Duration', value: validDates ? `${days}D / ${nights}N` : '—' },
    { label: 'Per person', value: budget ? formatINR(budget / people) : '—' },
    { label: 'Per person / day', value: budget && validDates ? formatINR(budget / people / days) : '—' },
  ];

  return (
    <div className="relative isolate overflow-hidden rounded-3xl text-white p-5 sm:p-6 min-h-[9rem] flex flex-col justify-end">
      <Photo
        key={values.destination.trim().toLowerCase() || 'empty'}
        name={values.destination.trim() || 'preview'}
        src={values.destination.trim() ? undefined : PHOTOS.mapFlatlay}
        width={900}
        height={300}
        className="-z-10"
      />
      <div className="flex items-center gap-2 text-sm text-white/80 min-w-0">
        <span className="truncate">{values.source.trim() || 'Source'}</span>
        <ArrowRight className="w-4 h-4 flex-shrink-0 text-orange-300" />
        <span className="truncate font-serif text-2xl font-semibold text-white capitalize text-shadow">{values.destination.trim() || 'Destination'}</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3">
        {items.map((i) => (
          <div key={i.label} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wider text-white/60">{i.label}</dt>
            <dd className="font-semibold tabular-nums truncate">{i.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SectionTitle({ step, children }) {
  return (
    <h3 className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
      <span className="w-6 h-6 rounded-full bg-orange-100 text-slate-800 text-xs flex items-center justify-center">{step}</span>
      {children}
    </h3>
  );
}

function Stepper({ id, label, value, onChange, error, min = 1, max = 50 }) {
  const n = Number(value) || 0;
  const set = (v) => onChange({ target: { value: String(Math.max(min, Math.min(max, v))) } });
  const btn =
    'w-11 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-orange-50 disabled:opacity-40 disabled:pointer-events-none transition-colors';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <div className={`flex items-stretch h-[42px] rounded-xl bg-white border overflow-hidden ${error ? 'border-rose-300' : 'border-slate-200'}`}>
        <button type="button" className={btn} onClick={() => set(n - 1)} disabled={n <= min} aria-label="Fewer travellers">
          <Minus className="w-4 h-4" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          className="flex-1 min-w-0 text-center text-sm font-semibold text-slate-900 tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button type="button" className={btn} onClick={() => set(n + 1)} disabled={n >= max} aria-label="More travellers">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

function ModePicker({ value, onChange, error }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="block text-sm font-medium text-slate-700 mb-1.5">How will you travel?</legend>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TRAVEL_MODES.map((m) => {
          const Icon = travelModeIcon(m.value);
          const active = value === m.value;
          return (
            <label
              key={m.value}
              className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl cursor-pointer text-xs font-medium text-center transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'bg-white ring-1 ring-inset ring-slate-200 text-slate-600 hover:ring-orange-300 hover:text-slate-900'
              }`}
            >
              <input
                type="radio"
                name="travel_mode"
                value={m.value}
                checked={active}
                onChange={onChange}
                className="sr-only"
              />
              <Icon className="w-5 h-5" />
              {m.label}
            </label>
          );
        })}
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </fieldset>
  );
}

export default function TripForm({ trip, initialValues, submitLabel, submitIcon, onSubmit, onCancel }) {
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <Alert>{formError}</Alert>

      <section className="space-y-4">
        <SectionTitle step={1}>Where are you going?</SectionTitle>
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
        <SectionTitle step={2}>When?</SectionTitle>
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
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle step={3}>Who’s going & how?</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          <Stepper
            id="number_of_people"
            label="Travellers"
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
        </div>
        <ModePicker value={values.travel_mode} onChange={set('travel_mode')} error={errors.travel_mode} />
      </section>

      <TripPreview values={values} />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={saving} icon={submitIcon}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
