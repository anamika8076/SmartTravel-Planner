import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, Users } from 'lucide-react';
import { TRAVEL_MODES, labelFor } from '../../constants/options';
import { formatDateRange, formatINR, nightsBetween, tripCountdown, tripStatus } from '../../utils/format';
import Photo from '../ui/Photo';
import { TravelModeIcon } from './travelModes';

export const STATUS_BADGE = {
  upcoming: { tone: 'teal', label: 'Upcoming', dot: 'bg-emerald-400' },
  ongoing: { tone: 'amber', label: 'On the road', dot: 'bg-amber-400 animate-pulse' },
  completed: { tone: 'slate', label: 'Completed', dot: 'bg-slate-300' },
};

export default function TripCard({ trip, index = 0 }) {
  const statusKey = tripStatus(trip.start_date, trip.end_date);
  const status = STATUS_BADGE[statusKey];
  const nights = nightsBetween(trip.start_date, trip.end_date);
  const done = statusKey === 'completed';

  return (
    <Link
      to={`/trips/${trip.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="group block bg-white rounded-3xl overflow-hidden ring-1 ring-slate-900/5 shadow-sm hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1 transition-all duration-300 animate-rise"
    >
      <div className="relative h-52 text-white">
        <Photo
          name={trip.destination}
          width={640}
          height={420}
          imgClassName={`group-hover:scale-105 !transition-[transform,opacity] !duration-700 ${done ? 'grayscale-[50%]' : ''}`}
        />
        <div className="relative h-full p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-[11px] font-semibold">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/85">
              <span className="truncate capitalize">{trip.source}</span>
              <ArrowRight className="w-3 h-3 flex-shrink-0" />
            </div>
            <h3 className="font-serif text-3xl font-semibold truncate capitalize text-shadow">{trip.destination}</h3>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p
            className={`text-sm font-semibold ${
              statusKey === 'upcoming' ? 'text-orange-600' : statusKey === 'ongoing' ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            {tripCountdown(trip.start_date, trip.end_date)}
          </p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-xs font-medium text-slate-600">
            <TravelModeIcon mode={trip.travel_mode} className="w-3.5 h-3.5" />
            {labelFor(TRAVEL_MODES, trip.travel_mode)}
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <dl className="space-y-1.5 text-sm text-slate-600 min-w-0">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <dd className="truncate">
                {formatDateRange(trip.start_date, trip.end_date)}
                <span className="text-slate-400"> · {nights + 1}D/{nights}N</span>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <dd>
                {trip.number_of_people} {Number(trip.number_of_people) === 1 ? 'traveller' : 'travellers'}
              </dd>
            </div>
          </dl>
          <div className="text-right flex-shrink-0">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Budget</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{formatINR(trip.estimated_budget)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
