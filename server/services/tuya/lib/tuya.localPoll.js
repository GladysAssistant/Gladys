const logger = require('../../../utils/logger');
const TuyAPI = require('tuyapi');
const { BadParameters } = require('../../../utils/coreErrors');

/**
 * @description Poll a Tuya device locally to retrieve DPS map.
 * @param {object} payload - Local connection info.
 * @returns {Promise<object>} DPS map.
 */
async function localPoll(payload) {
  const { deviceId, ip, localKey, protocolVersion, timeoutMs = 8000 } = payload || {};
  const effectiveTimeout = protocolVersion === '3.5' ? Math.max(timeoutMs, 15000) : timeoutMs;

  if (!deviceId || !ip || !localKey || !protocolVersion) {
    throw new BadParameters('Missing local connection parameters');
  }

  const tuyaLocal = new TuyAPI({
    id: deviceId,
    key: localKey,
    ip,
    version: protocolVersion,
  });

  const runGet = async (options) => {
    const operation = (async () => {
      await tuyaLocal.connect();
      const data = await tuyaLocal.get(options);
      return data;
    })();
    const data = await Promise.race([
      operation,
      new Promise((_, reject) =>
        setTimeout(() => reject(new BadParameters('Local poll timeout')), effectiveTimeout),
      ),
    ]);
    await tuyaLocal.disconnect();
    return data;
  };

  try {
    const attempts =
      protocolVersion === '3.5'
        ? [{ schema: true }, { schema: true, dps: [1] }, {}]
        : [{ schema: true }];
    let data = null;
    for (let i = 0; i < attempts.length; i += 1) {
      try {
        data = await runGet(attempts[i]);
        break;
      } catch (e) {
        if (i === attempts.length - 1) {
          throw e;
        }
      }
    }
    if (!data || typeof data !== 'object' || !data.dps) {
      const errorMessage =
        typeof data === 'string' ? `Invalid local poll response: ${data}` : 'Invalid local poll response';
      throw new BadParameters(errorMessage);
    }
    logger.debug(`[Tuya][localPoll] device=${deviceId} dps=${JSON.stringify(data)}`);
    return data;
  } catch (e) {
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
