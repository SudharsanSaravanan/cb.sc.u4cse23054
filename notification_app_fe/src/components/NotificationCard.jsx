import { Paper, Stack, Typography, Chip, Box } from '@mui/material';

const TYPE_COLOR = { Placement: 'warning', Result: 'success', Event: 'primary' };

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationCard({ notif, isNew, rank }) {
  const type = notif.notification_type || notif.type;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: isNew ? '#ffffff' : '#fafafa',
        borderLeft: `3px solid ${isNew ? '#1976d2' : 'transparent'}`,
        transition: 'border-color 0.2s',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
            {rank != null && (
              <Typography variant="caption" color="text.disabled" fontWeight={600}>
                #{rank}
              </Typography>
            )}
            {type && (
              <Chip
                label={type}
                color={TYPE_COLOR[type] || 'default'}
                size="small"
              />
            )}
            {isNew && (
              <Chip label="New" size="small" variant="outlined" color="primary" />
            )}
          </Stack>
          <Typography
            variant="subtitle2"
            fontWeight={isNew ? 700 : 400}
            noWrap={false}
            sx={{ wordBreak: 'break-word' }}
          >
            {notif.title || notif.message}
          </Typography>
          {notif.title && notif.message && (
            <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ wordBreak: 'break-word' }}>
              {notif.message}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {timeAgo(notif.createdAt)}
        </Typography>
      </Stack>
    </Paper>
  );
}
