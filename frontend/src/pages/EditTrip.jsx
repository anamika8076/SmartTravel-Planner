import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { Alert, Card, Spinner } from '../components/ui/Feedback';
import TripForm from '../components/trips/TripForm';
import { tripsApi } from '../api/endpoints';
import useTrip from './useTrip';

export default function EditTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trip, loading, error } = useTrip(id);

  const handleSubmit = async (body) => {
    await tripsApi.update(id, body);
    navigate(`/trips/${id}`, { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader back={{ to: `/trips/${id}`, label: 'Back to trip' }} title="Edit trip" />
      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert>{error.message}</Alert>
      ) : (
        <Card className="p-5 sm:p-8">
          <TripForm trip={trip} submitLabel="Save changes" onSubmit={handleSubmit} onCancel={() => navigate(`/trips/${id}`)} />
        </Card>
      )}
    </div>
  );
}
