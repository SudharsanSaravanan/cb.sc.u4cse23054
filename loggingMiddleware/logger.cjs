'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_ENDPOINT = process.env.LOG_API_URL || 'http://20.207.122.201/evaluation-service/logs';
const STACKS = new Set(['backend', 'frontend']);
const LEVELS = new Set(['debug', 'info', 'warn', 'error', 'fatal']);
const MAX_MESSAGE_LENGTH = 48;

function isLowerCase(value) {
  return typeof value === 'string' && value.length > 0 && value === value.toLowerCase();
}

function normalizeMessage(message) {
  if (typeof message !== 'string') return '';
  return message.trim().slice(0, MAX_MESSAGE_LENGTH);
}

function writeToFile(entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(LOG_FILE, line, () => {});
}

function validateLogInput(stack, level, packageName, message) {
  if (!STACKS.has(stack)) throw new Error(`Invalid stack value: ${stack}`);
  if (!LEVELS.has(level)) throw new Error(`Invalid level value: ${level}`);
  if (!isLowerCase(packageName)) throw new Error('Package must be a non-empty lowercase string');
  const normalized = normalizeMessage(message);
  if (normalized.length === 0) throw new Error('Message must be a non-empty string');
}

async function postLog(payload, endpoint = LOG_ENDPOINT) {
  try {
    const token = process.env.ACCESS_TOKEN;
    if (!token) {
      console.warn('No ACCESS_TOKEN found');
      return null;
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    const response = await axios.post(endpoint, payload, { headers });
    return response.data;
  } catch (error) {
    if (error.response) {
      const errorData = error.response.data;
      throw new Error(`Log API failed: ${error.response.status} - ${JSON.stringify(errorData)}`);
    }
    if (error.request) throw new Error('No response from log API');
    throw new Error(error.message);
  }
}

async function Log(stack, level, packageName, message) {
  validateLogInput(stack, level, packageName, message);
  const safeMessage = normalizeMessage(message);
  const payload = { stack, level, package: packageName, message: safeMessage };
  writeToFile({ ...payload, timestamp: new Date().toISOString() });
  try {
    return await postLog(payload);
  } catch (error) {
    console.error('Logging middleware failed:', error.message);
    throw error;
  }
}

async function safeLog(stack, level, packageName, message) {
  try {
    return await Log(stack, level, packageName, message);
  } catch (error) {
    console.error('Logging middleware failed:', error.message);
    return null;
  }
}

function createLogger(defaults = {}) {
  return {
    log: (stack, level, packageName, message) => safeLog(stack, level, packageName, message),
    debug: (packageName, message) => safeLog(defaults.stack || 'backend', 'debug', packageName, message),
    info: (packageName, message) => safeLog(defaults.stack || 'backend', 'info', packageName, message),
    warn: (packageName, message) => safeLog(defaults.stack || 'backend', 'warn', packageName, message),
    error: (packageName, message) => safeLog(defaults.stack || 'backend', 'error', packageName, message),
    fatal: (packageName, message) => safeLog(defaults.stack || 'backend', 'fatal', packageName, message),
  };
}

module.exports = { Log, postLog, validateLogInput, createLogger };
