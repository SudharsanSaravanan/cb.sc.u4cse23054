'use strict';

const express = require('express');
const { getNotifications, getPriorityNotifications } = require('../services/notificationService');
const { Log } = require('../../logger');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    await Log('backend', 'info', 'notifications', 'fetch all request');
    const data = await getNotifications(req.query);
    res.json({ success: true, data });
  } catch (err) {
    await Log('backend', 'error', 'notifications', err.message.slice(0, 48));
    next(err);
  }
});

router.get('/priority', async (req, res, next) => {
  try {
    await Log('backend', 'info', 'notifications', 'priority inbox request');
    const { n, notification_type } = req.query;
    const notifications = await getPriorityNotifications({ n, notification_type });
    res.json({ success: true, data: { notifications, count: notifications.length } });
  } catch (err) {
    await Log('backend', 'error', 'notifications', err.message.slice(0, 48));
    next(err);
  }
});

module.exports = router;
