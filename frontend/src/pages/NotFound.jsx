import React from 'react';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';

export default function NotFound() {
  return (
    <EmptyState icon={Compass} title="Looks like you’re off the map" action={<Button to="/">Take me home</Button>}>
      The page you’re looking for doesn’t exist.
    </EmptyState>
  );
}
