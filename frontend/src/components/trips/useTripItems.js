import { useCallback, useEffect, useState } from 'react';

/**
 * Loads and manages the items of one resource (transport options,
 * accommodations…) that belong to a single trip.
 */
export default function useTripItems(api, tripId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // `?trip=` is ignored if the backend has no filter; we filter here too.
      const all = await api.list({ trip: tripId });
      setItems(all.filter((item) => String(item.trip) === String(tripId)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (body) => {
    const created = await api.create(body);
    setItems((list) => [...list, created]);
    return created;
  };

  const update = async (id, body) => {
    const updated = await api.update(id, body);
    setItems((list) => list.map((item) => (item.id === id ? updated : item)));
    return updated;
  };

  const remove = async (id) => {
    await api.remove(id);
    setItems((list) => list.filter((item) => item.id !== id));
  };

  return { items, loading, error, reload: load, create, update, remove };
}
