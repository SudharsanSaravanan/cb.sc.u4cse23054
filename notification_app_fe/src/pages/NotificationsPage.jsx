import { useState, useCallback } from 'react';
import { Box, Stack, Pagination, Snackbar, Alert } from '@mui/material';
import { useNotifications } from '../hooks/useNotifications';
import { useWebSocket } from '../hooks/useWebSocket';
import FilterBar from '../components/FilterBar';
import NotificationCard from '../components/NotificationCard';
import StatusView from '../components/StatusView';

const PAGE_SIZE = 10;

function useSeenIds() {
  const [seen, setSeen] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('seen_ids') || '[]'));
    } catch {
      return new Set();
    }
  });

  const markSeen = useCallback((ids) => {
    setSeen(prev => {
      const next = new Set([...prev, ...ids]);
      localStorage.setItem('seen_ids', JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { seen, markSeen };
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [liveAlert, setLiveAlert] = useState(false);
  const { seen, markSeen } = useSeenIds();

  const { data, loading, error, refetch } = useNotifications({
    page,
    limit: PAGE_SIZE,
    notification_type: typeFilter,
  });

  useWebSocket(useCallback((msg) => {
    if (msg.event === 'notification_received') {
      setLiveAlert(true);
    }
  }, []));

  const notifications = data?.notifications ?? data?.data?.notifications ?? [];
  const totalPages = data?.pagination?.totalPages ?? data?.data?.pagination?.totalPages ?? 1;
  const total = data?.pagination?.total ?? data?.data?.pagination?.total;

  const ids = notifications.map(n => n.id || n._id).filter(Boolean);
  if (ids.length) markSeen(ids);

  const handleTypeChange = (val) => {
    setTypeFilter(val);
    setPage(1);
  };

  return (
    <Box>
      <FilterBar
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        totalLabel={total != null ? `${total} notifications` : null}
      />

      <StatusView
        loading={loading}
        error={error}
        empty={!loading && !error && notifications.length === 0}
        onRetry={refetch}
      />

      {!loading && !error && (
        <Stack spacing={1}>
          {notifications.map((notif) => {
            const id = notif.id || notif._id;
            return (
              <NotificationCard
                key={id || Math.random()}
                notif={notif}
                isNew={id ? !seen.has(id) : false}
              />
            );
          })}
        </Stack>
      )}

      {!loading && !error && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            size="small"
          />
        </Box>
      )}

      <Snackbar
        open={liveAlert}
        autoHideDuration={4000}
        onClose={() => setLiveAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="info" onClose={() => setLiveAlert(false)} sx={{ width: '100%' }}>
          New notification received
        </Alert>
      </Snackbar>
    </Box>
  );
}
