import React, { useState } from 'react';
import { ExternalLink, Plane, PlaneTakeoff, Search, Users } from 'lucide-react';
import { TextField } from '../ui/Field';
import { Alert } from '../ui/Feedback';
import Button from '../ui/Button';
import { flightsApi } from '../../api/endpoints';
import { airportCodeFor } from '../../constants/airports';
import { todayISO } from '../../utils/format';
import TransportForm from './TransportForm';

export default function FlightSearch({
  trip,
  onDone,
  onSave,
  savedOptions = [],
}) {
  const [form, setForm] = useState({
    origin: airportCodeFor(trip.source),
    destination: airportCodeFor(trip.destination),
    date_from: trip.start_date >= todayISO() ? trip.start_date : todayISO(),
    adults: String(Math.min(Math.max(Number(trip.number_of_people) || 1, 1), 9)),
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchUrl, setSearchUrl] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(true);

  const set = (field) => (event) => {
    const value = field === 'origin' || field === 'destination'
      ? event.target.value.toUpperCase().slice(0, 3)
      : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setSearchUrl('');
    setSavedMessage('');
    if (errors[field]) setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!/^[A-Z]{3}$/.test(form.origin)) nextErrors.origin = '3-letter code, e.g. DEL';
    if (!/^[A-Z]{3}$/.test(form.destination)) nextErrors.destination = '3-letter code, e.g. BOM';
    if (!nextErrors.origin && form.origin === form.destination) {
      nextErrors.destination = 'Must differ from origin';
    }
    if (!form.date_from || form.date_from < todayISO()) nextErrors.date_from = 'Today or later';
    const adults = Number(form.adults);
    if (!Number.isInteger(adults) || adults < 1 || adults > 9) nextErrors.adults = '1 to 9';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const search = async (event) => {
    event.preventDefault();
    setError('');
    setSearchUrl('');
    setSavedMessage('');
    setShowSaveForm(true);
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await flightsApi.search({
        ...form,
        adults: Number(form.adults),
        trip_id: trip.id,
      });
      setSearchUrl(data.search_url || '');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-emerald-50 px-3.5 py-3 text-xs leading-relaxed text-emerald-900">
        Search opens Google Flights. The app does not fetch or import live fares. After checking an offer, enter its details below to compare it in your trip plan.
      </div>
      <form onSubmit={search} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField id="fs-origin" label="From (airport)" icon={PlaneTakeoff} placeholder="DEL" value={form.origin} onChange={set('origin')} error={errors.origin} autoComplete="off" />
          <TextField id="fs-destination" label="To (airport)" icon={Plane} placeholder="BOM" value={form.destination} onChange={set('destination')} error={errors.destination} autoComplete="off" />
          <TextField id="fs-date" label="Date" type="date" min={todayISO()} value={form.date_from} onChange={set('date_from')} error={errors.date_from} />
          <TextField id="fs-adults" label="Adults" type="number" min="1" max="9" icon={Users} value={form.adults} onChange={set('adults')} error={errors.adults} />
        </div>
        <Button type="submit" icon={Search} loading={loading} className="w-full">
          Search flights for free
        </Button>
      </form>

      <Alert>{error}</Alert>
      {searchUrl && (
        <>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
          >
            View flights on Google Flights <ExternalLink className="h-4 w-4" />
          </a>
          {onSave && showSaveForm && (
            <details className="rounded-2xl ring-1 ring-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                Add a flight you verified
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-xs leading-relaxed text-slate-500">
                  Saved flight options: {savedOptions.filter((option) => option.transport_type === 'flight').length}.
                  Enter the quoted total for all travellers. The planner will show one balanced pick and up to three alternatives.
                </p>
                <TransportForm
                  trip={trip}
                  option={{
                    transport_type: 'flight',
                    origin: form.origin,
                    destination: form.destination,
                    departure_time: `${trip.start_date}T08:00`,
                    booking_url: searchUrl,
                  }}
                  defaultTransportType="flight"
                  fixedTransportType
                  requirePositiveCost
                  requiredDepartureDate={trip.start_date}
                  costHint={`Total for all ${trip.number_of_people} traveller${Number(trip.number_of_people) === 1 ? '' : 's'}.`}
                  onSubmit={async (body) => {
                    await onSave(body);
                    setSavedMessage('Flight option saved. Regenerate the plan to compare it.');
                    setShowSaveForm(false);
                  }}
                  onCancel={() => setShowSaveForm(false)}
                />
              </div>
            </details>
          )}
          {savedMessage && (
            <p role="status" className="text-sm font-medium text-emerald-700">
              {savedMessage}
            </p>
          )}
        </>
      )}
      <div className="flex justify-end pt-1">
        <Button variant="secondary" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
