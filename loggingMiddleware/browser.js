const LOG_ENDPOINT = '/evaluation-service/logs';
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

export function validateLogInput(stack, level, packageName, message) {
  if (!STACKS.has(stack)) throw new Error(`Invalid stack value: ${stack}`);
  if (!LEVELS.has(level)) throw new Error(`Invalid level value: ${level}`);
  if (!isLowerCase(packageName)) throw new Error('Package must be a non-empty lowercase string');
  const normalized = normalizeMessage(message);
  if (normalized.length === 0) throw new Error('Message must be a non-empty string');
}

export async function postLog(payload, endpoint = LOG_ENDPOINT) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Log API failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    return response.json();
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function Log(stack, level, packageName, message) {
  validateLogInput(stack, level, packageName, message);
  const safeMessage = normalizeMessage(message);
  const payload = { stack, level, package: packageName, message: safeMessage };
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

export function createLogger(defaults = {}) {
  return {
    log: (stack, level, packageName, message) => safeLog(stack, level, packageName, message),
    debug: (packageName, message) => safeLog(defaults.stack || 'frontend', 'debug', packageName, message),
    info: (packageName, message) => safeLog(defaults.stack || 'frontend', 'info', packageName, message),
    warn: (packageName, message) => safeLog(defaults.stack || 'frontend', 'warn', packageName, message),
    error: (packageName, message) => safeLog(defaults.stack || 'frontend', 'error', packageName, message),
    fatal: (packageName, message) => safeLog(defaults.stack || 'frontend', 'fatal', packageName, message),
  };
}
