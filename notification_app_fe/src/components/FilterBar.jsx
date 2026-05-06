import { Stack, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';

const TYPES = ['Event', 'Result', 'Placement'];

export default function FilterBar({ typeFilter, onTypeChange, totalLabel }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={1}
      mb={2}
    >
      {totalLabel && (
        <Typography variant="body2" color="text.secondary">
          {totalLabel}
        </Typography>
      )}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Type</InputLabel>
        <Select value={typeFilter} label="Type" onChange={e => onTypeChange(e.target.value)}>
          <MenuItem value="">All Types</MenuItem>
          {TYPES.map(t => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
