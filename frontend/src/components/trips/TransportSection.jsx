import React, { useState } from 'react';
import { Bike, Bus, Car, CheckCircle2, Circle, ExternalLink, Pencil, Plane, PlaneTakeoff, TrainFront, Trash2, Route } from 'lucide-react';
import { Modal } from '../ui/Modal';
import FlightSearch from './FlightSearch';
import ItemsSection from './ItemsSection';
import TransportForm from './TransportForm';
import useTripItems from './useTripItems';
import Button from '../ui/Button';
import { Badge } from '../ui/Feedback';
import { transportApi } from '../../api/endpoints';
import { TRANSPORT_TYPES, labelFor } from '../../constants/options';
import { formatDuration, formatINR, minutesBetween, splitDateTime } from '../../utils/format';

const ICONS = { flight: Plane, train: TrainFront, bus: Bus, car: Car, bike: Bike };

const LEG_LABEL = { outbound: 'Getting there', return: 'Coming back' };
const legOf = (o) => (o.direction === 'return' ? 'return' : 'outbound');

function bestIds(items) {
  if (items.length < 2) return {};
  const byCost = [...items].sort((a, b) => Number(a.estimated_cost) - Number(b.estimated_cost));
  const withTime = items
    .map((i) => ({ id: i.id, mins: minutesBetween(i.departure_time, i.arrival_time) }))
    .filter((i) => i.mins > 0)
    .sort((a, b) => a.mins - b.mins);
  return { cheapest: byCost[0]?.id, fastest: withTime[0]?.id };
}

function TransportItem({ option, best, heading, onSelect, onEdit, onDelete }) {
  const Icon = ICONS[option.transport_type] || Route;
  const duration = minutesBetween(option.departure_time, option.arrival_time);
  const dep = splitDateTime(option.departure_time);
  const arr = splitDateTime(option.arrival_time);

  return (
    <>
    {heading && <p className="pt-1 pb-0.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{heading}</p>}
    <div className={`group/item rounded-xl ring-1 ${option.is_selected ? 'ring-2 ring-emerald-400' : 'ring-slate-200'} hover:ring-orange-200 hover:shadow-md hover:shadow-slate-900/5 bg-white transition-all`}>
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4" />
          </span>
          <span className="font-medium text-slate-900">{labelFor(TRANSPORT_TYPES, option.transport_type)}</span>
          {option.provider && <span className="text-sm text-slate-500 truncate">· {option.provider}</span>}
          {option.is_estimate && <Badge tone="amber">Estimate</Badge>}
        </div>
        <p className="font-semibold text-slate-900 tabular-nums flex-shrink-0">{formatINR(option.estimated_cost)}</p>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900 tabular-nums leading-tight">{dep.time}</p>
          <p className="text-xs text-slate-500 truncate">{option.origin}</p>
          <p className="text-[11px] text-slate-400">{dep.date}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 min-w-[4rem]">
          <span className="text-[11px] text-slate-500 tabular-nums">{duration > 0 ? formatDuration(duration) : ''}</span>
          <div className="w-full flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="flex-1 border-t border-dashed border-slate-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          </div>
          <div className="flex gap-1 h-5">
            {option.is_selected && <Badge tone="emerald">Your pick</Badge>}
            {best.cheapest === option.id && <Badge tone="emerald">Cheapest</Badge>}
            {best.fastest === option.id && <Badge tone="sky">Fastest</Badge>}
          </div>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-lg font-semibold text-slate-900 tabular-nums leading-tight">{arr.time}</p>
          <p className="text-xs text-slate-500 truncate">{option.destination}</p>
          <p className="text-[11px] text-slate-400">{arr.date}</p>
        </div>
      </div>

      <div className="px-2 py-1.5 border-t border-slate-100 flex items-center justify-end gap-0.5">
        {option.booking_url && (
          <Button size="sm" variant="ghost" icon={ExternalLink} href={option.booking_url} className="mr-auto !text-orange-600 hover:!bg-orange-50">
            {option.transport_type === 'flight' ? 'View search' : 'Book'}
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={option.is_selected ? CheckCircle2 : Circle} onClick={onSelect}
          aria-pressed={!!option.is_selected} className={option.is_selected ? '!text-emerald-700' : ''}>
          {option.is_selected ? 'Selected' : 'Use this'}
        </Button>
        <Button size="sm" variant="ghost" icon={Pencil} onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="ghost-danger" icon={Trash2} onClick={onDelete}>Delete</Button>
      </div>
    </div>
    </>
  );
}

export default function TransportSection({ trip, reloadKey, onChange }) {
  const raw = useTripItems(transportApi, trip.id, reloadKey, onChange);
  // Outbound first, then the return leg, each sorted by departure.
  const items = [...raw.items].sort((a, b) =>
    (legOf(a) === legOf(b) ? 0 : legOf(a) === 'outbound' ? -1 : 1)
    || String(a.departure_time).localeCompare(String(b.departure_time)));
  const state = { ...raw, items };
  const bestByLeg = {
    outbound: bestIds(items.filter((i) => legOf(i) === 'outbound')),
    return: bestIds(items.filter((i) => legOf(i) === 'return')),
  };
  // Picking one unselects the others on that leg server-side, so refetch.
  const select = async (option) => {
    await raw.update(option.id, { is_selected: !option.is_selected });
    await raw.reload({ silent: true });
  };
  const [searching, setSearching] = useState(false);

  const saveFlight = async (body) => {
    await state.create(body);
  };

  return (
    <>
    <Modal open={searching} title="Search flights" onClose={() => setSearching(false)}>
      {searching && <FlightSearch trip={trip} onSave={saveFlight} savedOptions={state.items} onDone={() => setSearching(false)} />}
    </Modal>
    <ItemsSection
      extraAction={
        <Button size="sm" icon={PlaneTakeoff} onClick={() => setSearching(true)}>
          Search flights
        </Button>
      }
      title="Travel"
      icon={Route}
      tint="bg-sky-50 text-sky-600"
      description="Suggested fares are estimates. Pick one per leg, or add your own booking."
      addLabel="Add transport option"
      noun="transport option"
      emptyText="Add a flight, train, bus or drive to compare options."
      state={state}
      renderItem={(option, { items: list, onEdit, onDelete }) => {
        const index = list.indexOf(option);
        const heading = index === 0 || legOf(list[index - 1]) !== legOf(option) ? LEG_LABEL[legOf(option)] : null;
        return (
          <TransportItem option={option} best={bestByLeg[legOf(option)]} heading={heading}
            onSelect={() => select(option)} onEdit={onEdit} onDelete={onDelete} />
        );
      }}
      renderForm={({ item, onSubmit, onCancel }) => (
        <TransportForm trip={trip} option={item} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
    </>
  );
}
