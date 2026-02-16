const TuyAPI = require('tuyapi');
const logger = require('../../../utils/logger');
const { BadParameters } = require('../../../utils/coreErrors');

/**
 * @description Poll a Tuya device locally to retrieve DPS map.
 * @param {object} payload - Local connection info.
 * @returns {Promise<object>} DPS map.
 * @example
 * await localPoll({ deviceId: 'id', ip: '1.1.1.1', localKey: 'key', protocolVersion: '3.3' });
 */
async function localPoll(payload) {
  const { deviceId, ip, localKey, protocolVersion, timeoutMs = 8000, fastScan = false } = payload || {};
  const effectiveTimeout = protocolVersion === '3.5' && !fastScan ? Math.max(timeoutMs, 15000) : timeoutMs;

  if (!deviceId || !ip || !localKey || !protocolVersion) {
    throw new BadParameters('Missing local connection parameters');
  }

  const tuyaLocal = new TuyAPI({
    id: deviceId,
    key: localKey,
    ip,
    version: protocolVersion,
  });
  let lastError = null;
  const onError = (err) => {
    lastError = err;
    logger.info(`[Tuya][localPoll] socket error for device=${deviceId}: ${err.message}`);
  };
  tuyaLocal.on('error', onError);

  const runGet = async (options) => {
    let errorListener;
    let timeoutId;
    let resolved = false;
    const cleanup = async () => {
      if (resolved) {
        return;
      }
      resolved = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (errorListener) {
        tuyaLocal.removeListener('error', errorListener);
      }
      try {
        await tuyaLocal.disconnect();
      } catch (err) {
        // ignore
      }
    };
    try {
      const operation = (async () => {
        await tuyaLocal.connect();
        const data = await tuyaLocal.get(options);
        return data;
      })();
      const data = await Promise.race([
        operation,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new BadParameters('Local poll timeout')), effectiveTimeout);
        }),
        new Promise((_, reject) => {
          errorListener = (err) => {
            reject(new BadParameters(`Local poll socket error: ${err.message}`));
          };
          tuyaLocal.once('error', errorListener);
        }),
      ]);
      await cleanup();
      return data;
    } catch (e) {
      await cleanup();
      throw e;
    }
  };

  try {
    const attempts =
      protocolVersion === '3.5' ? [{ schema: true }, { schema: true, dps: [1] }, {}] : [{ schema: true }];
    const tryAttempt = async (index) => {
      try {
        return await runGet(attempts[index]);
      } catch (e) {
        if (index >= attempts.length - 1) {
          throw e;
        }
        return tryAttempt(index + 1);
      }
    };
    const data = await tryAttempt(0);
    if (!data || typeof data !== 'object' || !data.dps) {
      const errorMessage =
        typeof data === 'string' ? `Invalid local poll response: ${data}` : 'Invalid local poll response';
      throw new BadParameters(errorMessage);
    }
    logger.debug(`[Tuya][localPoll] device=${deviceId} dps=${JSON.stringify(data)}`);
    return data;
  } catch (e) {
    if (lastError && (!e || e.message !== lastError.message)) {
      logger.info(`[Tuya][localPoll] last socket error for device=${deviceId}: ${lastError.message}`);
    }
    logger.warn(`[Tuya][localPoll] failed for device=${deviceId}`, e);
    try {
      await tuyaLocal.disconnect();
    } catch (err) {
      // ignore
    }
    throw e;
  }
}

module.exports = {
  localPoll,
};
