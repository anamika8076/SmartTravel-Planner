import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Users, Wallet } from 'lucide-react';
import { Badge } from '../ui/Feedback';
import { TRAVEL_MODES, labelFor } from '../../constants/options';
import { formatDateRange, formatINR, nightsBetween, tripStatus } from '../../utils/format';

export const STATUS_BADGE = {
  upcoming: { tone: 'teal', label: 'Upcoming' },
  ongoing: { tone: 'amber', label: 'On the road' },
  completed: { tone: 'slate', label: 'Completed' },
};

export default function TripCard({ trip }) {
  const status = STATUS_BADGE[tripStatus(trip.start_date, trip.end_date)];
  const nights = nightsBetween(trip.start_date, trip.end_date);

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge>{labelFor(TRAVEL_MODES, trip.travel_mode)}</Badge>
      </div>

      <div className="mt-4 flex items-center gap-2 min-w-0">
        <span className="text-sm text-slate-500 truncate">{trip.source}</span>
        <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
      </div>
      <h3 className="font-serif text-2xl font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
        {trip.destination}
      </h3>

      <dl className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-slate-500">
        <div className="col-span-3 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          <dd className="text-slate-700">
            {formatDateRange(trip.start_date, trip.end_date)}
            <span className="text-slate-400"> · {nights + 1}D/{nights}N</span>
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <dd className="text-slate-700">{trip.number_of_people}</dd>
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5" />
          <dd className="text-slate-700 font-medium">{formatINR(trip.estimated_budget)}</dd>
        </div>
      </dl>
    </Link>
  );
}
