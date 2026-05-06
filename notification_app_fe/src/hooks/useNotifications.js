import { useState, useEffect, useCallback } from 'react';
import { fetchNotifications, fetchPriority } from '../api/notifications';
import { Log } from '../logger';

export function useNotifications({ page, limit, notification_type }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Log('frontend', 'info', 'usenotifications', 'fetching notifications');
      const result = await fetchNotifications({ page, limit, notification_type });
      setData(result.data ?? result);
    } catch (err) {
      await Log('frontend', 'error', 'usenotifications', err.message.slice(0, 48));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, notification_type]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

export function usePriority({ n, notification_type }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Log('frontend', 'info', 'usepriority', 'fetching priority inbox');
      const result = await fetchPriority({ n, notification_type });
      setData(result.data ?? result);
    } catch (err) {
      await Log('frontend', 'error', 'usepriority', err.message.slice(0, 48));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [n, notification_type]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}
