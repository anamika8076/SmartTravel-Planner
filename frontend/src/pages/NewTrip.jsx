import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Feedback';
import TripForm from '../components/trips/TripForm';
import { tripsApi } from '../api/endpoints';

export default function NewTrip() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destination = params.get('destination');

  const handleSubmit = async (body) => {
    const trip = await tripsApi.create(body);
    navigate(`/trips/${trip.id}`, { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        back={{ to: '/trips', label: 'My trips' }}
        title="Plan a new trip"
        subtitle="Start with the basics. You can add transport and stay options next."
      />
      <Card className="p-5 sm:p-8">
        <TripForm
          initialValues={destination ? { destination } : undefined}
          submitLabel="Create trip"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/trips')}
        />
      </Card>
    </div>
  );
}
