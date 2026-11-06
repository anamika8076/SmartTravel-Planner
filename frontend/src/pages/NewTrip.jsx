import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
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
        eyebrow="New trip"
        title={
          <>
            Let’s plan your <span className="italic text-orange-500">next escape</span>
          </>
        }
        subtitle="Start with the basics — you can add transport and stays right after."
      />
      <Card className="p-5 sm:p-8 animate-rise">
        <TripForm
          initialValues={destination ? { destination } : undefined}
          submitLabel="Create trip"
          submitIcon={Sparkles}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/trips')}
        />
      </Card>
    </div>
  );
}
