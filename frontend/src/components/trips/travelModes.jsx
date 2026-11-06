import React from 'react';
import { Bus, Car, CarFront, Route } from 'lucide-react';

const ICONS = {
  self_vehicle: Car,
  rented_vehicle: CarFront,
  public_transport: Bus,
  any: Route,
};

export function travelModeIcon(mode) {
  return ICONS[mode] || Route;
}

export function TravelModeIcon({ mode, className }) {
  const Icon = travelModeIcon(mode);
  return <Icon className={className} />;
}
