import React from 'react';
import { Bike, Bus, Car, ExternalLink, Pencil, Plane, TrainFront, Trash2, Route } from 'lucide-react';
import ItemsSection from './ItemsSection';
import TransportForm from './TransportForm';
import useTripItems from './useTripItems';
import Button from '../ui/Button';
import { Badge } from '../ui/Feedback';
import { transportApi } from '../../api/endpoints';
import { TRANSPORT_TYPES, labelFor } from '../../constants/options';
import { formatDate, formatDuration, formatINR, minutesBetween } from '../../utils/format';

const ICONS = { flight: Plane, train: TrainFront, bus: Bus, car: Car, bike: Bike };

function bestIds(items) {
  if (items.length < 2) return {};
  const byCost = [...items].sort((a, b) => Number(a.estimated_cost) - Number(b.estimated_cost));
  const withTime = items
    .map((i) => ({ id: i.id, mins: minutesBetween(i.departure_time, i.arrival_time) }))
    .filter((i) => i.mins > 0)
    .sort((a, b) => a.mins - b.mins);
  return { cheapest: byCost[0]?.id, fastest: withTime[0]?.id };
}

function splitDateTime(value) {
  const [date = '', time = ''] = String(value || '').split('T');
  return { date: formatDate(date, { withYear: false }), time: time.slice(0, 5) || '—' };
}

function TransportItem({ option, best, onEdit, onDelete }) {
  const Icon = ICONS[option.transport_type] || Route;
  const duration = minutesBetween(option.departure_time, option.arrival_time);
  const dep = splitDateTime(option.departure_time);
  const arr = splitDateTime(option.arrival_time);

  return (
    <div className="group/item rounded-xl ring-1 ring-slate-200 hover:ring-orange-200 hover:shadow-md hover:shadow-slate-900/5 bg-white transition-all">
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4" />
          </span>
          <span className="font-medium text-slate-900">{labelFor(TRANSPORT_TYPES, option.transport_type)}</span>
          {option.provider && <span className="text-sm text-slate-500 truncate">· {option.provider}</span>}
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
            Book
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={Pencil} onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="ghost-danger" icon={Trash2} onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}

export default function TransportSection({ trip }) {
  const state = useTripItems(transportApi, trip.id);
  const best = bestIds(state.items);

  return (
    <ItemsSection
      title="Getting there"
      icon={Route}
      tint="bg-sky-50 text-sky-600"
      description="Compare transport options for this trip."
      addLabel="Add transport option"
      noun="transport option"
      emptyText="Add a flight, train, bus or drive to compare options."
      state={state}
      renderItem={(option, { onEdit, onDelete }) => (
        <TransportItem option={option} best={best} onEdit={onEdit} onDelete={onDelete} />
      )}
      renderForm={({ item, onSubmit, onCancel }) => (
        <TransportForm trip={trip} option={item} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  );
}
