import React from 'react';
import { ArrowRight, Bus, Car, CarTaxiFront, ExternalLink, Pencil, Plane, TrainFront, Trash2, Route } from 'lucide-react';
import ItemsSection from './ItemsSection';
import TransportForm from './TransportForm';
import useTripItems from './useTripItems';
import Button from '../ui/Button';
import { Badge } from '../ui/Feedback';
import { transportApi } from '../../api/endpoints';
import { TRANSPORT_TYPES, labelFor } from '../../constants/options';
import { formatDateTime, formatDuration, formatINR, minutesBetween } from '../../utils/format';

const ICONS = { flight: Plane, train: TrainFront, bus: Bus, car: Car, taxi: CarTaxiFront };

function bestIds(items) {
  if (items.length < 2) return {};
  const byCost = [...items].sort((a, b) => Number(a.estimated_cost) - Number(b.estimated_cost));
  const withTime = items
    .map((i) => ({ id: i.id, mins: minutesBetween(i.departure_time, i.arrival_time) }))
    .filter((i) => i.mins > 0)
    .sort((a, b) => a.mins - b.mins);
  return { cheapest: byCost[0]?.id, fastest: withTime[0]?.id };
}

function TransportItem({ option, best, onEdit, onDelete }) {
  const Icon = ICONS[option.transport_type] || Route;
  const duration = minutesBetween(option.departure_time, option.arrival_time);

  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900">{labelFor(TRANSPORT_TYPES, option.transport_type)}</span>
            {option.provider && <span className="text-sm text-slate-500">· {option.provider}</span>}
            {best.cheapest === option.id && <Badge tone="emerald">Cheapest</Badge>}
            {best.fastest === option.id && <Badge tone="sky">Fastest</Badge>}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 min-w-0">
            <span className="truncate">{option.origin}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <span className="truncate">{option.destination}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(option.departure_time)} → {formatDateTime(option.arrival_time)}
            {duration > 0 && <span className="text-slate-400"> · {formatDuration(duration)}</span>}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-slate-900">{formatINR(option.estimated_cost)}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
        {option.booking_url && (
          <Button size="sm" variant="ghost" icon={ExternalLink} href={option.booking_url}>
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
      description="Compare transport options for this trip."
      addLabel="Add transport option"
      noun="transport option"
      emptyText="No transport options yet. Add a flight, train, bus or drive to compare."
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
