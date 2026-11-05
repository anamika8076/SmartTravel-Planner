import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Car, MapPinned, Pencil, Trash2, Users, Wallet } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Alert, Badge, Card, EmptyState, Spinner } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import { STATUS_BADGE } from '../components/trips/TripCard';
import TransportSection from '../components/trips/TransportSection';
import AccommodationSection from '../components/trips/AccommodationSection';
import { tripsApi } from '../api/endpoints';
import { TRAVEL_MODES, labelFor } from '../constants/options';
import { formatDateRange, formatINR, nightsBetween, tripStatus } from '../utils/format';
import useTrip from './useTrip';

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-semibold text-slate-900 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
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

  if (loading) return <Spinner label="Loading trip…" />;

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
  const people = Number(trip.number_of_people) || 1;
  const status = STATUS_BADGE[tripStatus(trip.start_date, trip.end_date)];

  return (
    <>
      <PageHeader
        back={{ to: '/trips', label: 'My trips' }}
        eyebrow={`${trip.source} → ${trip.destination}`}
        title={`Trip to ${trip.destination}`}
        actions={
          <>
            <Button variant="secondary" icon={Pencil} to={`/trips/${trip.id}/edit`}>Edit</Button>
            <Button variant="secondary" icon={Trash2} onClick={() => setConfirmOpen(true)} className="hover:!text-rose-600 hover:!border-rose-200">
              Delete
            </Button>
          </>
        }
      />

      <Card className="p-5 sm:p-6 mb-6">
        <div className="mb-5">
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <Stat icon={CalendarDays} label="Dates" value={formatDateRange(trip.start_date, trip.end_date)} sub={`${nights + 1} days · ${nights} nights`} />
          <Stat icon={Users} label="Travellers" value={`${people} ${people === 1 ? 'person' : 'people'}`} />
          <Stat
            icon={Wallet}
            label="Budget"
            value={formatINR(trip.estimated_budget)}
            sub={`≈ ${formatINR(Number(trip.estimated_budget) / people)} per person`}
          />
          <Stat icon={Car} label="Travel mode" value={labelFor(TRAVEL_MODES, trip.travel_mode)} />
        </div>
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
    </>
  );
}
