'use strict';

const store = [];
const MAX = 10000;

function addLog(entry) {
  const record = { ...entry, id: store.length, timestamp: entry.timestamp || new Date().toISOString() };
  store.push(record);
  if (store.length > MAX) store.shift();
  return record.id;
}

function getLogs({ stack, level, package: pkg, limit = 100 } = {}) {
  let result = [...store];
  if (stack) result = result.filter(l => l.stack === stack);
  if (level) result = result.filter(l => l.level === level);
  if (pkg) result = result.filter(l => l.package === pkg);
  result.reverse();
  return { total: result.length, logs: result.slice(0, Math.min(parseInt(limit), 1000)) };
}

function getStats() {
  const byLevel = {}, byStack = {}, byPackage = {};
  store.forEach(l => {
    byLevel[l.level] = (byLevel[l.level] || 0) + 1;
    byStack[l.stack] = (byStack[l.stack] || 0) + 1;
    byPackage[l.package] = (byPackage[l.package] || 0) + 1;
  });
  return { totalLogs: store.length, byLevel, byStack, byPackage };
}

module.exports = { addLog, getLogs, getStats };
