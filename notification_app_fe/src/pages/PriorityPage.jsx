import { useState, useCallback } from 'react';
import {
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { usePriority } from '../hooks/useNotifications';
import { useWebSocket } from '../hooks/useWebSocket';
import FilterBar from '../components/FilterBar';
import NotificationCard from '../components/NotificationCard';
import StatusView from '../components/StatusView';

const N_OPTIONS = [10, 15, 20];

export default function PriorityPage() {
  const [n, setN] = useState(10);
  const [typeFilter, setTypeFilter] = useState('');

  const { data, loading, error, refetch } = usePriority({ n, notification_type: typeFilter });

  useWebSocket(useCallback(() => { refetch(); }, [refetch]));

  const notifications = data?.notifications ?? [];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        mb={2}
      >
        <Typography variant="body2" color="text.secondary">
          Top {n} by priority
        </Typography>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Show</InputLabel>
            <Select value={n} label="Show" onChange={e => setN(e.target.value)}>
              {N_OPTIONS.map(v => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Placement">Placement</MenuItem>
              <MenuItem value="Result">Result</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <StatusView
        loading={loading}
        error={error}
        empty={!loading && !error && notifications.length === 0}
        onRetry={refetch}
      />

      {!loading && !error && (
        <Stack spacing={1}>
          {notifications.map((notif, idx) => {
            const id = notif.id || notif._id;
            return (
              <NotificationCard
                key={id || idx}
                notif={notif}
                rank={idx + 1}
                isNew={false}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
