const BASE = 'http://localhost:5000/api/notifications';

export async function fetchNotifications({ page = 1, limit = 10, notification_type } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (notification_type) params.set('notification_type', notification_type);
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchPriority({ n = 10, notification_type } = {}) {
  const params = new URLSearchParams({ n });
  if (notification_type) params.set('notification_type', notification_type);
  const res = await fetch(`${BASE}/priority?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
