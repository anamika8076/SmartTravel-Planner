import { request, requestList } from './client';

function withQuery(path, params) {
  const qs = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `${path}?${qs}` : path;
}

function resource(base, { auth }) {
  return {
    list: (params) => requestList(withQuery(base, params), { auth }),
    get: (id) => request(`${base}${id}/`, { auth }),
    create: (body) => request(base, { method: 'POST', body, auth }),
    update: (id, body) => request(`${base}${id}/`, { method: 'PATCH', body, auth }),
    remove: (id) => request(`${base}${id}/`, { method: 'DELETE', auth }),
  };
}

export const authApi = {
  register: ({ username, email, password }) =>
    request('/api/accounts/register/', { method: 'POST', body: { username, email, password } }),
  login: ({ username, password }) =>
    request('/api/token/', { method: 'POST', body: { username, password } }),
};

export const tripsApi = resource('/api/trips/', { auth: true });
export const transportApi = resource('/api/transport-options/', { auth: true });
export const accommodationsApi = resource('/api/accommodations/', { auth: true });

// Public, read-only
export const destinationsApi = resource('/api/destinations/', { auth: false });
export const placesApi = resource('/api/places/', { auth: false });

// Planner: one optimal plan per trip.
// generate → full result (transport, stay, recommendations, costs, itinerary).
// latest   → saved plan with itinerary items only (404 if none yet).
export const plannerApi = {
  generate: (tripId) => request(`/api/planner/trips/${tripId}/generate/`, { method: 'POST', body: {}, auth: true }),
  latest: (tripId) => request(`/api/planner/trips/${tripId}/latest/`, { auth: true }),
};

// Live flight offers (provider can be unavailable → 502).
export const flightsApi = {
  search: ({ origin, destination, date_from, adults }) =>
    request(withQuery('/api/flights/search/', { origin, destination, date_from, adults }), { auth: true }),
};

// Hotels saved from OpenStreetMap for a destination (no prices).
export const hotelsApi = {
  search: (cityName) => request(withQuery('/api/hotels/search/', { city_name: cityName }), { auth: true }),
};

// Look up a city on OpenStreetMap and save its places (public).
export const destinationSearchApi = {
  search: ({ city, state }) => request('/api/destinations/search/', { method: 'POST', body: { city, state } }),
};
