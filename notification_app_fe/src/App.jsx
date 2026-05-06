import { NavLink, Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Container, Tab, Tabs } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationsPage from './pages/NotificationsPage';
import PriorityPage from './pages/PriorityPage';

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabValue = location.pathname === '/priority' ? 1 : 0;

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          Notifications
        </Typography>
        <Tabs
          value={tabValue}
          onChange={(_, v) => navigate(v === 1 ? '/priority' : '/')}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="All" />
          <Tab label="Priority" />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Nav />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<NotificationsPage />} />
          <Route path="/priority" element={<PriorityPage />} />
        </Routes>
      </Container>
    </Box>
  );
}
