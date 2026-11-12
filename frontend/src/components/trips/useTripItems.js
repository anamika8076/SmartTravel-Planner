import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads and manages the items of one resource (transport options,
 * accommodations…) that belong to a single trip.
 *
 * - `reloadKey`: bump it to refetch quietly (e.g. another part of the page
 *   added an item). Changes made through this hook don't trigger a refetch.
 * - `onChange`: called after this hook creates, updates or deletes an item.
 */
export default function useTripItems(api, tripId, reloadKey = 0, onChange) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const ownChange = useRef(false);
  const firstLoad = useRef(true);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        // `?trip=` is ignored if the backend has no filter; we filter here too.
        const all = await api.list({ trip: tripId });
        setItems(all.filter((item) => String(item.trip) === String(tripId)));
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [api, tripId]
  );

  useEffect(() => {
    firstLoad.current = true;
    load();
  }, [load]);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (ownChange.current) {
      ownChange.current = false;
      return;
    }
    load({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const notify = () => {
    ownChange.current = true;
    onChange?.();
  };

  const create = async (body) => {
    const created = await api.create(body);
    setItems((list) => [...list, created]);
    notify();
    return created;
  };

  const update = async (id, body) => {
    const updated = await api.update(id, body);
    setItems((list) => list.map((item) => (item.id === id ? updated : item)));
    notify();
    return updated;
  };

  const remove = async (id) => {
    await api.remove(id);
    setItems((list) => list.filter((item) => item.id !== id));
    notify();
  };

  return { items, loading, error, reload: load, create, update, remove };
}
