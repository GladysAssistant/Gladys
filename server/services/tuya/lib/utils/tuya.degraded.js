const LOCAL_FAILURE_THRESHOLD = 3;
const LOCAL_FAILURE_WINDOW_MS = 30 * 1000;
const DEGRADED_DURATION_MS = 5 * 60 * 1000;

const DEGRADING_ERROR_CODES = [
  'ECONNRESET',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'EHOSTDOWN',
  'ENETUNREACH',
];

const isDegradingError = (error) => {
  if (!error) {
    return false;
  }
  if (error.code && DEGRADING_ERROR_CODES.includes(error.code)) {
    return true;
  }
  if (typeof error.message === 'string') {
    return DEGRADING_ERROR_CODES.some((code) => error.message.includes(code));
  }
  return false;
};

const recordLocalFailure = (map, deviceId, error, now = Date.now()) => {
  if (!map || !deviceId || !isDegradingError(error)) {
    return null;
  }

  let entry = map[deviceId];
  if (!entry) {
    entry = { failureTimestamps: [], until: 0, status: 'ok' };
    map[deviceId] = entry;
  }

  const windowStart = now - LOCAL_FAILURE_WINDOW_MS;
  entry.failureTimestamps = entry.failureTimestamps.filter((ts) => ts >= windowStart);
  entry.failureTimestamps.push(now);

  if (entry.failureTimestamps.length >= LOCAL_FAILURE_THRESHOLD) {
    entry.status = 'degraded';
    entry.until = now + DEGRADED_DURATION_MS;
    entry.failureTimestamps = [];
  }
  return entry;
};

const recordLocalSuccess = (map, deviceId) => {
  if (!map || !deviceId) {
    return;
  }
  delete map[deviceId];
};

const resetLocalStatus = (map, deviceId) => {
  if (!map || !deviceId) {
    return;
  }
  delete map[deviceId];
};

const getLocalStatus = (map, deviceId, now = Date.now()) => {
  if (!map || !deviceId) {
    return null;
  }
  const entry = map[deviceId];
  if (!entry || entry.status === 'ok') {
    return null;
  }
  if (entry.until <= now) {
    delete map[deviceId];
    return null;
  }
  return { status: entry.status, until: entry.until };
};

const isLocalSkipNeeded = (map, deviceId, now = Date.now()) => Boolean(getLocalStatus(map, deviceId, now));

const getAllDegraded = (map, now = Date.now()) => {
  if (!map) {
    return {};
  }
  const result = {};
  Object.keys(map).forEach((deviceId) => {
    const status = getLocalStatus(map, deviceId, now);
    if (status) {
      result[deviceId] = status;
    }
  });
  return result;
};

module.exports = {
  LOCAL_FAILURE_THRESHOLD,
  LOCAL_FAILURE_WINDOW_MS,
  DEGRADED_DURATION_MS,
  DEGRADING_ERROR_CODES,
  isDegradingError,
  recordLocalFailure,
  recordLocalSuccess,
  resetLocalStatus,
  getLocalStatus,
  isLocalSkipNeeded,
  getAllDegraded,
};
