const TuyAPI = require('tuyapi');
const TuyAPINewGen = require('@demirdeniz/tuyapi-newgen');
const logger = require('../../../utils/logger');
const { BadParameters } = require('../../../utils/coreErrors');
const { mergeDevices } = require('../../../utils/device');
const { DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { normalizeExistingDevice, upsertParam, getParamValue } = require('./utils/tuya.deviceParams');
const { addFallbackBinaryFeature } = require('./device/tuya.localMapping');
const { convertDevice } = require('./device/tuya.convertDevice');

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
  const formatSocketError = (err) => {
    if (!err || !err.message) {
      return 'Local poll socket error';
    }
    const networkErrorCodes = ['EHOSTUNREACH', 'EHOSTDOWN', 'ENETUNREACH', 'ECONNREFUSED', 'ETIMEDOUT'];
    if (networkErrorCodes.includes(err.code)) {
      return `Local device unreachable at ${ip}:6668 (${err.code}). Device may be offline, unplugged, or no longer connected to Wi-Fi.`;
    }
    if (typeof err.message === 'string' && err.message.includes('EHOSTUNREACH')) {
      return `Local device unreachable at ${ip}:6668 (EHOSTUNREACH). Device may be offline, unplugged, or no longer connected to Wi-Fi.`;
    }
    return `Local poll socket error: ${err.message}`;
  };
  const onError = (err) => {
    lastError = err;
    logger.info(`[Tuya][localPoll] socket error for device=${deviceId}: ${formatSocketError(err)}`);
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
            reject(new BadParameters(formatSocketError(err)));
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
    return data;
  } catch (e) {
    if (lastError && (!e || e.message !== lastError.message)) {
      logger.info(`[Tuya][localPoll] last socket error for device=${deviceId}: ${formatSocketError(lastError)}`);
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
  const existingParams = Array.isArray(device.params) ? [...device.params] : [];
  const resolvedProductId = device.product_id || getParamValue(existingParams, DEVICE_PARAM_NAME.PRODUCT_ID);
  const resolvedProductKey = device.product_key || getParamValue(existingParams, DEVICE_PARAM_NAME.PRODUCT_KEY);
  const resolvedCloudIp = device.cloud_ip || getParamValue(existingParams, DEVICE_PARAM_NAME.CLOUD_IP);
  const resolvedProtocolVersion =
    protocolVersion || getParamValue(existingParams, DEVICE_PARAM_NAME.PROTOCOL_VERSION) || device.protocol_version;
  const resolvedLocalKey = localKey || getParamValue(existingParams, DEVICE_PARAM_NAME.LOCAL_KEY) || device.local_key;
  const resolvedIp = ip || getParamValue(existingParams, DEVICE_PARAM_NAME.IP_ADDRESS) || device.ip;

  const hasFeatures = Array.isArray(device.features) && device.features.length > 0;
  const hasDeviceMetadata = Boolean(device.properties || device.thing_model || device.specifications);
  if (!hasFeatures && hasDeviceMetadata) {
    const rebuiltDevice = convertDevice.call(tuyaManager, {
      id: deviceId,
      name: device.name,
      product_name: device.model,
      model: device.model,
      product_id: resolvedProductId,
      product_key: resolvedProductKey,
      local_key: resolvedLocalKey,
      ip: resolvedIp,
      cloud_ip: resolvedCloudIp,
      protocol_version: resolvedProtocolVersion,
      local_override: true,
      online: device.online,
      properties: device.properties,
      thing_model: device.thing_model,
      specifications: device.specifications || {},
      category: device.category,
      tuya_report: device.tuya_report,
    });

    if (Array.isArray(rebuiltDevice.features) && rebuiltDevice.features.length > 0) {
      device = {
        ...device,
        ...rebuiltDevice,
      };
    }
  }

  device.product_id = resolvedProductId;
  device.product_key = resolvedProductKey;
  device.protocol_version = resolvedProtocolVersion;
  device.ip = resolvedIp;
  device.local_override = true;
  if (resolvedLocalKey) {
    device.local_key = resolvedLocalKey;
  }
  device.params = Array.isArray(device.params) ? [...device.params] : [];
  upsertParam(device.params, DEVICE_PARAM_NAME.IP_ADDRESS, resolvedIp);
  upsertParam(device.params, DEVICE_PARAM_NAME.PROTOCOL_VERSION, resolvedProtocolVersion);
  if (resolvedLocalKey) {
    upsertParam(device.params, DEVICE_PARAM_NAME.LOCAL_KEY, resolvedLocalKey);
  }
  upsertParam(device.params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE, true);
  upsertParam(device.params, DEVICE_PARAM_NAME.PRODUCT_ID, resolvedProductId);
  upsertParam(device.params, DEVICE_PARAM_NAME.PRODUCT_KEY, resolvedProductKey);

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
