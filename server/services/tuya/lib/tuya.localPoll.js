const TuyAPI = require('tuyapi');
const TuyAPINewGen = require('@demirdeniz/tuyapi-newgen');
const logger = require('../../../utils/logger');
const { BadParameters } = require('../../../utils/coreErrors');
const { mergeDevices } = require('../../../utils/device');
const { DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { normalizeExistingDevice, upsertParam } = require('./utils/tuya.deviceParams');
const { addFallbackBinaryFeature } = require('./device/tuya.localMapping');

/**
 * @description Poll a Tuya device locally to retrieve DPS map.
 * @param {object} payload - Local connection info.
 * @returns {Promise<object>} DPS map.
 * @example
 * await localPoll({ deviceId: 'id', ip: '1.1.1.1', localKey: 'key', protocolVersion: '3.3' });
 */
async function localPoll(payload) {
  const { deviceId, ip, localKey, protocolVersion, timeoutMs = 3000, fastScan = false, logDps = true } = payload || {};
  const isProtocol35 = protocolVersion === '3.5';
  const parsedTimeout = Number(timeoutMs);
  const sanitizedTimeout = Number.isFinite(parsedTimeout) ? Math.min(Math.max(parsedTimeout, 500), 30000) : 3000;
  const effectiveTimeout = isProtocol35 && !fastScan ? Math.max(sanitizedTimeout, 5000) : sanitizedTimeout;
  const TuyaLocalApi = isProtocol35 ? TuyAPINewGen : TuyAPI;

  if (!deviceId || !ip || !localKey || !protocolVersion) {
    throw new BadParameters('Missing local connection parameters');
  }

  const tuyaOptions = {
    id: deviceId,
    key: localKey,
    ip,
    version: protocolVersion,
    issueGetOnConnect: false,
    issueRefreshOnConnect: false,
    issueRefreshOnPing: false,
  };
  if (isProtocol35) {
    tuyaOptions.keepAlive = false;
    tuyaOptions.socketTimeout = Math.max(effectiveTimeout, 5000);
  }
  const tuyaLocal = new TuyaLocalApi(tuyaOptions);
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
    if (logDps) {
      logger.debug(`[Tuya][localPoll] device=${deviceId} dps=${JSON.stringify(data)}`);
    }
    tuyaLocal.removeListener('error', onError);
    return data;
  } catch (e) {
    if (lastError && (!e || e.message !== lastError.message)) {
      logger.info(`[Tuya][localPoll] last socket error for device=${deviceId}: ${lastError.message}`);
    }
    logger.warn(`[Tuya][localPoll] failed for device=${deviceId}`, e);
    try {
      tuyaLocal.removeListener('error', onError);
      await tuyaLocal.disconnect();
    } catch (err) {
      // ignore
    }
    throw e;
  }
}

/**
 * @description Update discovered device list after a successful local poll.
 * @param {object} tuyaManager - Tuya handler instance.
 * @param {object} payload - Local poll payload.
 * @returns {object|null} Updated device when found.
 * @example
 * updateDiscoveredDeviceAfterLocalPoll(tuyaManager, { deviceId: 'id', ip: '1.1.1.1', protocolVersion: '3.3' });
 */
function updateDiscoveredDeviceAfterLocalPoll(tuyaManager, payload) {
  const { deviceId, ip, protocolVersion, localKey, dps } = payload || {};
  if (!deviceId || !tuyaManager || !Array.isArray(tuyaManager.discoveredDevices)) {
    return null;
  }
  const externalId = `tuya:${deviceId}`;
  const deviceIndex = tuyaManager.discoveredDevices.findIndex((device) => device.external_id === externalId);
  if (deviceIndex < 0) {
    return null;
  }

  let device = { ...tuyaManager.discoveredDevices[deviceIndex] };
  device.protocol_version = protocolVersion;
  device.ip = ip;
  device.local_override = true;
  if (localKey) {
    device.local_key = localKey;
  }
  device.params = Array.isArray(device.params) ? [...device.params] : [];
  upsertParam(device.params, DEVICE_PARAM_NAME.IP_ADDRESS, ip);
  upsertParam(device.params, DEVICE_PARAM_NAME.PROTOCOL_VERSION, protocolVersion);
  if (localKey) {
    upsertParam(device.params, DEVICE_PARAM_NAME.LOCAL_KEY, localKey);
  }
  upsertParam(device.params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE, true);
  upsertParam(device.params, DEVICE_PARAM_NAME.PRODUCT_ID, device.product_id);
  upsertParam(device.params, DEVICE_PARAM_NAME.PRODUCT_KEY, device.product_key);

  device = addFallbackBinaryFeature(device, dps);

  if (tuyaManager.gladys && tuyaManager.gladys.stateManager) {
    const existing = normalizeExistingDevice(
      tuyaManager.gladys.stateManager.get('deviceByExternalId', device.external_id),
    );
    device = mergeDevices(device, existing);
  }

  tuyaManager.discoveredDevices[deviceIndex] = device;
  return device;
}

module.exports = {
  localPoll,
  updateDiscoveredDeviceAfterLocalPoll,
};
