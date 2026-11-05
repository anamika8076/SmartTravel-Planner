import { useCallback, useEffect, useState } from 'react';
import { tripsApi } from '../api/endpoints';

export default function useTrip(id) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTrip(await tripsApi.get(id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { trip, setTrip, loading, error, reload: load };
}
