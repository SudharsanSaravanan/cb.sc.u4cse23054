'use strict';

const express = require('express');
const { addLog, getLogs, getStats } = require('../services/logService');

const router = express.Router();

router.post('/', (req, res) => {
  const { stack, level, package: pkg, message } = req.body;
  if (!stack || !level || !pkg || !message) {
    return res.status(400).json({ success: false, error: 'missing required fields' });
  }
  const logId = addLog(req.body);
  res.json({ logID: logId, message: 'log created successfully' });
});

router.get('/', (req, res) => {
  const result = getLogs(req.query);
  res.json({ success: true, ...result });
});

router.get('/stats', (req, res) => {
  res.json({ success: true, stats: getStats() });
});

module.exports = router;
