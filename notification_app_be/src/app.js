'use strict';

const express = require('express');
const cors = require('cors');
const logRoutes = require('./routes/logs');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, error: err.message || 'internal server error' });
});

module.exports = app;
