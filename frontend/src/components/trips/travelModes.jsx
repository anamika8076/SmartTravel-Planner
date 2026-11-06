import React from 'react';
import { Bus, Car, CarFront, Plane, TrainFront } from 'lucide-react';

const ICONS = {
  self_vehicle: Car,
  rented_vehicle: CarFront,
  bus: Bus,
  train: TrainFront,
  flight: Plane,
};

export function travelModeIcon(mode) {
  return ICONS[mode] || Car;
}

export function TravelModeIcon({ mode, className }) {
  const Icon = travelModeIcon(mode);
  return <Icon className={className} />;
}
