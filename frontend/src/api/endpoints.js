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

// Planner: one plan per trip. generate and latest return the same full plan
// JSON; each itinerary edit returns { message, plan } with the updated plan.
const unwrapPlan = (data) => data?.response_data ?? data;

export const plannerApi = {
  generate: (tripId, useAI = false) =>
    request(`/api/planner/trips/${tripId}/generate/`, { method: 'POST', body: { use_ai: useAI }, auth: true }).then(unwrapPlan),
  latest: (tripId) => request(`/api/planner/trips/${tripId}/latest/`, { auth: true }).then(unwrapPlan),
  addItem: (tripId, body) =>
    request(`/api/planner/trips/${tripId}/itinerary/items/`, { method: 'POST', body, auth: true }).then((d) => d.plan),
  deleteItem: (tripId, itemId) =>
    request(`/api/planner/trips/${tripId}/itinerary/items/${itemId}/`, { method: 'DELETE', auth: true }).then((d) => d.plan),
  moveItem: (tripId, itemId, body) =>
    request(`/api/planner/trips/${tripId}/itinerary/items/${itemId}/move/`, { method: 'PATCH', body, auth: true }).then((d) => d.plan),
  reorderDay: (tripId, day, itemIds) =>
    request(`/api/planner/trips/${tripId}/itinerary/reorder/`, { method: 'PATCH', body: { day, item_ids: itemIds }, auth: true }).then((d) => d.plan),
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
