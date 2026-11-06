import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, CalendarClock, MapPinned, Pencil, Trash2, Users, Wallet, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Hero from '../components/ui/Hero';
import { Alert, Card, EmptyState } from '../components/ui/Feedback';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/Modal';
import { STATUS_BADGE } from '../components/trips/TripCard';
import { TravelModeIcon } from '../components/trips/travelModes';
import TransportSection from '../components/trips/TransportSection';
import AccommodationSection from '../components/trips/AccommodationSection';
import { tripsApi } from '../api/endpoints';
import { TRAVEL_MODES, labelFor } from '../constants/options';
import { formatDateRange, formatINR, nightsBetween, tripCountdown, tripStatus } from '../utils/format';
import useTrip from './useTrip';

function Stat({ icon: Icon, label, value, sub, tint }) {
  return (
    <div className="flex items-start gap-3 p-3.5 sm:p-5">
      <span className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 ${tint}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Icon className={`sm:hidden w-3.5 h-3.5 rounded ${tint} bg-transparent`} />
          {label}
        </p>
        <p className="font-semibold text-slate-900 tabular-nums text-[15px] sm:text-base">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function RouteLine({ trip }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 max-w-xl px-4 py-3 rounded-2xl bg-black/25 backdrop-blur-md ring-1 ring-inset ring-white/15">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-white/60">From</p>
        <p className="font-semibold truncate capitalize">{trip.source}</p>
      </div>
      <div className="flex-1 flex items-center gap-2 min-w-[4rem]">
        <span className="w-2 h-2 rounded-full bg-sky-300 flex-shrink-0" />
        <span className="flex-1 border-t-2 border-dashed border-white/40" />
        <span className="w-9 h-9 rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur flex items-center justify-center flex-shrink-0">
          <TravelModeIcon mode={trip.travel_mode} className="w-4 h-4" />
        </span>
        <span className="flex-1 border-t-2 border-dashed border-white/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-orange-400 ring-4 ring-orange-400/30 flex-shrink-0" />
      </div>
      <div className="min-w-0 text-right">
        <p className="text-[11px] uppercase tracking-wider text-white/60">To</p>
        <p className="font-semibold truncate capitalize">{trip.destination}</p>
      </div>
    </div>
  );
}

function TripSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trip, loading, error } = useTrip(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await tripsApi.remove(id);
      navigate('/trips', { replace: true });
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <TripSkeleton />;

  if (error) {
    return error.status === 404 ? (
      <EmptyState icon={MapPinned} title="Trip not found" action={<Button to="/trips">Back to my trips</Button>}>
        This trip doesn’t exist or doesn’t belong to your account.
      </EmptyState>
    ) : (
      <Alert>{error.message}</Alert>
    );
  }

  const nights = nightsBetween(trip.start_date, trip.end_date);
  const days = nights + 1;
  const people = Number(trip.number_of_people) || 1;
  const budget = Number(trip.estimated_budget) || 0;
  const statusKey = tripStatus(trip.start_date, trip.end_date);
  const status = STATUS_BADGE[statusKey];

  return (
    <div className="space-y-6">
      <Hero name={trip.destination} minHeight="min-h-[22rem] sm:min-h-[28rem]">
        <div className="flex-1 flex flex-col justify-between gap-8 pb-12 sm:pb-16">
          <div className="flex items-center justify-between gap-3">
            <Link to="/trips" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              My trips
            </Link>
            <div className="flex gap-2">
              <Button variant="light" size="sm" icon={Pencil} to={`/trips/${trip.id}/edit`}>
                Edit
              </Button>
              <Button
                variant="light"
                size="sm"
                icon={Trash2}
                onClick={() => setConfirmOpen(true)}
                className="hover:!bg-rose-500/80 hover:!ring-rose-300"
              >
                Delete
              </Button>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-xs font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-xs font-semibold shadow">
                <CalendarClock className="w-3.5 h-3.5" />
                {tripCountdown(trip.start_date, trip.end_date)}
              </span>
            </div>
            <h1 className="font-serif text-5xl sm:text-7xl font-semibold tracking-tight text-shadow break-words capitalize">
              {trip.destination}
            </h1>
          </div>

          <RouteLine trip={trip} />
        </div>
      </Hero>

      <Card className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 -mt-16 sm:-mt-20 relative mx-3 sm:mx-8 !rounded-3xl shadow-xl shadow-slate-900/10">
        <Stat
          icon={CalendarDays}
          tint="bg-sky-50 text-sky-600"
          label="Dates"
          value={formatDateRange(trip.start_date, trip.end_date)}
          sub={`${days} days · ${nights} nights`}
        />
        <Stat
          icon={Users}
          tint="bg-violet-50 text-violet-600"
          label="Travellers"
          value={`${people} ${people === 1 ? 'person' : 'people'}`}
          sub={labelFor(TRAVEL_MODES, trip.travel_mode)}
        />
        <Stat
          icon={Wallet}
          tint="bg-emerald-50 text-emerald-600"
          label="Total budget"
          value={formatINR(budget)}
          sub={`${formatINR(budget / people)} per person`}
        />
        <Stat
          icon={Wallet}
          tint="bg-orange-50 text-orange-600"
          label="Daily budget"
          value={`${formatINR(budget / people / days)}`}
          sub="per person, per day"
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <TransportSection trip={trip} />
        <AccommodationSection trip={trip} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this trip?"
        message={`Your trip from ${trip.source} to ${trip.destination} will be permanently deleted.`}
        confirmLabel="Delete trip"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteError('');
        }}
      />
    </div>
  );
}
