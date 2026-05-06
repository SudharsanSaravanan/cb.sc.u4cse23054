'use strict';

const axios = require('axios');

const EXTERNAL_API = process.env.NOTIFICATION_API_URL || 'http://20.207.122.201/evaluation-service/notifications';

const TYPE_WEIGHT = { Placement: 100, Result: 50, Event: 10 };

function priorityScore(notif) {
  const weight = TYPE_WEIGHT[notif.notification_type] || 0;
  const created = notif.createdAt ? new Date(notif.createdAt).getTime() : 0;
  const ageHours = Math.floor((Date.now() - created) / 3_600_000);
  return weight + ageHours;
}

function buildHeaders() {
  const token = process.env.ACCESS_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function callAPI(params) {
  const response = await axios.get(EXTERNAL_API, {
    params,
    headers: buildHeaders(),
    timeout: 10000,
  });
  return response.data;
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.notifications)) return data.notifications;
  if (data.data && Array.isArray(data.data.notifications)) return data.data.notifications;
  return [];
}

async function getNotifications({ page = 1, limit = 10, notification_type } = {}) {
  const params = { page: parseInt(page), limit: parseInt(limit) };
  if (notification_type) params.notification_type = notification_type;
  return callAPI(params);
}

async function getPriorityNotifications({ n = 10, notification_type } = {}) {
  const params = { page: 1, limit: 100 };
  if (notification_type) params.notification_type = notification_type;
  const data = await callAPI(params);
  const list = extractList(data);
  return list
    .slice()
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, Math.max(1, parseInt(n)));
}

module.exports = { getNotifications, getPriorityNotifications };
