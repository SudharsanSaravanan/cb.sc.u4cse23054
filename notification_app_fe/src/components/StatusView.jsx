import { Box, Typography, Button } from '@mui/material';

export default function StatusView({ loading, error, empty, onRetry }) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <Box
          sx={{
            width: 28,
            height: 28,
            border: '3px solid #e0e0e0',
            borderTopColor: '#1976d2',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
          }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={6}>
        <Typography color="error" mb={1}>{error}</Typography>
        {onRetry && (
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        )}
      </Box>
    );
  }

  if (empty) {
    return (
      <Box textAlign="center" py={6}>
        <Typography color="text.secondary">No notifications found.</Typography>
      </Box>
    );
  }

  return null;
}
