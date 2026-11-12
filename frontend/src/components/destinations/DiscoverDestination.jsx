import React, { useState } from 'react';
import { Globe2, MapPin, Search } from 'lucide-react';
import { TextField } from '../ui/Field';
import { Alert } from '../ui/Feedback';
import Button from '../ui/Button';
import Combobox from '../ui/Combobox';
import { destinationSearchApi, destinationsApi } from '../../api/endpoints';
import { titleCase } from '../../utils/format';

const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

/**
 * Looks a city up on OpenStreetMap through the backend, which saves its
 * places. Calls onFound({ id, name, newPlaces, total }) on success.
 */
export default function DiscoverDestination({ initialCity = '', initialState = '', onFound, onCancel, variant = 'modal', inputRef }) {
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!city.trim()) found.city = 'Enter a city or town.';
    if (!state.trim()) found.state = 'Enter its state.';
    setErrors(found);
    setError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      // Send names capitalised ("kasol" → "Kasol") so they're saved consistently.
      const cityName = titleCase(city);
      const stateName = titleCase(state);
      const data = await destinationSearchApi.search({ city: cityName, state: stateName });
      let id = data?.places?.[0]?.destination;
      if (!id) {
        const list = await destinationsApi.list();
        id = list.find((d) => d.name?.toLowerCase() === cityName.toLowerCase())?.id;
      }
      onFound({
        id,
        name: data?.result?.destination || cityName,
        newPlaces: data?.result?.new_places_saved ?? 0,
        total: data?.result?.total_places_received ?? data?.places?.length ?? 0,
        hotels: data?.hotels?.total_hotels_received ?? null,
        hotelsError: data?.hotels?.error || '',
      });
    } catch (err) {
      if (err.status === 404) setError(`No places were found for “${titleCase(city)}”. Check the spelling, or try a nearby larger town.`);
      else if (err.status >= 500) setError('The map service (OpenStreetMap) is busy right now. Please try again in a minute.');
      else setError(err.message);
      setLoading(false);
    }
  };

  if (variant === 'hero') {
    const field =
      'w-full rounded-full bg-white py-3.5 pl-12 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-400/50';
    return (
      <form onSubmit={submit} noValidate className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:p-1.5 sm:rounded-full sm:bg-white sm:shadow-2xl sm:shadow-black/30">
          <div className="relative flex-1 min-w-0">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              aria-label="City or town"
              aria-invalid={!!errors.city}
              placeholder="City or town, e.g. Shimla"
              value={city}
              onChange={(e) => { setCity(e.target.value); setErrors((er) => ({ ...er, city: '' })); }}
              className={`${field} sm:focus:ring-0`}
              autoComplete="off"
            />
          </div>
          <div className="relative flex-1 min-w-0 sm:border-l sm:border-slate-200">
            <Combobox
              id="dd-state-hero"
              ariaLabel="State"
              ariaInvalid={!!errors.state}
              icon={Globe2}
              label="States & UTs"
              placeholder="State, e.g. Kerala"
              options={STATES}
              value={state}
              onChange={(e) => { setState(e.target.value); setErrors((er) => ({ ...er, state: '' })); }}
              inputClassName={`${field} sm:focus:ring-0`}
            />
          </div>
          <Button type="submit" variant="accent" icon={Search} loading={loading} className="!py-3.5 sm:!py-3 !px-6 flex-shrink-0">
            {loading ? 'Discovering…' : 'Discover'}
          </Button>
        </div>
        {(errors.city || errors.state) && (
          <p className="text-sm text-orange-200">{errors.city || errors.state}</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-white bg-rose-500/80 backdrop-blur rounded-2xl px-4 py-2.5">{error}</p>
        )}
        {loading && !error && (
          <p className="text-sm text-white/80">Looking it up on OpenStreetMap — this can take up to a minute…</p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-slate-600">
        We’ll look the place up on OpenStreetMap and save its attractions, cafés, restaurants and hotels. This can take up to a minute.
      </p>
      <Alert>{error}</Alert>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextField id="dd-city" label="City or town" icon={MapPin} placeholder="e.g. Shimla" value={city} onChange={(e) => { setCity(e.target.value); setErrors((er) => ({ ...er, city: '' })); }} error={errors.city} autoComplete="off" />
        <div className="space-y-1.5">
          <label htmlFor="dd-state" className="block text-sm font-medium text-slate-700">State</label>
          <Combobox
            id="dd-state"
            ariaInvalid={!!errors.state}
            icon={Globe2}
            label="States & UTs"
            placeholder="e.g. Himachal Pradesh"
            options={STATES}
            value={state}
            onChange={(e) => { setState(e.target.value); setErrors((er) => ({ ...er, state: '' })); }}
            inputClassName={`w-full rounded-xl border bg-white py-2.5 pl-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${errors.state ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-orange-500/15'}`}
          />
          {errors.state && <p className="text-xs text-rose-500 font-medium">{errors.state}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>}
        <Button type="submit" icon={Search} loading={loading}>{loading ? 'Searching…' : 'Find places'}</Button>
      </div>
    </form>
  );
}
