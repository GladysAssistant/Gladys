const dgram = require('dgram');
const { UDP_KEY } = require('@demirdeniz/tuyapi-newgen/lib/config');
const { MessageParser } = require('@demirdeniz/tuyapi-newgen/lib/message-parser');
const logger = require('../../../utils/logger');
const { mergeDevices } = require('../../../utils/device');
const { convertDevice } = require('./device/tuya.convertDevice');
const {
  applyExistingLocalOverride,
  normalizeExistingDevice,
  updateDiscoveredDeviceWithLocalInfo,
} = require('./utils/tuya.deviceParams');
const { buildLocalScanReport } = require('./utils/tuya.report');

const DEFAULT_PORTS = [6666, 6667, 7000];
/**
 * @description Scan local network for Tuya devices (UDP broadcast).
 * @param {number|object} input - Scan duration in seconds or options.
 * @returns {Promise<object>} Map of deviceId -> { ip, version, productKey }.
 * @example
 * await localScan({ timeoutSeconds: 10 });
 */
async function localScan(input = 10) {
  const options = typeof input === 'object' ? input || {} : { timeoutSeconds: input };
  const parsedTimeout = Number(options.timeoutSeconds);
  const timeoutSeconds = Number.isFinite(parsedTimeout) ? Math.min(Math.max(parsedTimeout, 1), 30) : 10;
  const devices = {};
  const portErrors = {};
  const sockets = [];
  const parsers = [
    new MessageParser({ key: UDP_KEY, version: 3.1 }),
    new MessageParser({ key: UDP_KEY, version: 3.5 }),
  ];

  logger.info(`[Tuya][localScan] Starting udp scan for ${timeoutSeconds}s on ports ${DEFAULT_PORTS.join(', ')}`);

  const onMessage = (message, rinfo) => {
    const byteLen = message ? message.length : 0;
    const remote = rinfo ? `${rinfo.address}:${rinfo.port}` : 'unknown';
    const source = rinfo && rinfo.source ? rinfo.source : 'udp';
    logger.debug(`[Tuya][localScan] Packet received (${source}) from ${remote} len=${byteLen}`);
    let parsed = null;
    let lastError = null;
    for (let i = 0; i < parsers.length; i += 1) {
      try {
        parsed = parsers[i].parse(message);
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!parsed) {
      logger.info(
        `[Tuya][localScan] Unable to parse payload from ${remote} (len=${byteLen}): ${
          lastError ? lastError.message : 'unknown'
        }`,
      );
      return;
    }
    const safePayload =
      parsed && parsed[0] && parsed[0].payload
        ? {
            gwId: parsed[0].payload.gwId,
            devId: parsed[0].payload.devId,
            id: parsed[0].payload.id,
            version: parsed[0].payload.version,
            hasIp: !!parsed[0].payload.ip,
          }
        : null;
    logger.debug(`[Tuya][localScan] Parsed packet from ${remote}: ${JSON.stringify(safePayload)}`);
    const payload = parsed && parsed[0] && parsed[0].payload;

    if (!payload || typeof payload !== 'object') {
      logger.info(`[Tuya][localScan] Ignoring payload from ${remote} (len=${byteLen}): invalid payload`);
      return;
    }

    const { gwId, devId, id, ip, version, productKey } = payload;
    const resolvedIp = ip || (rinfo && rinfo.address);
    const deviceId = gwId || devId || id;

    if (!deviceId) {
      logger.info(`[Tuya][localScan] Ignoring payload from ${remote} (len=${byteLen}): missing deviceId`);
      return;
    }

    const isNew = !devices[deviceId];
    devices[deviceId] = {
      ip: resolvedIp,
      version,
      productKey,
    };
    if (isNew) {
      logger.info(`[Tuya][localScan] Found device ${deviceId} ip=${ip || 'unknown'} version=${version || 'unknown'}`);
    }
  };

  DEFAULT_PORTS.forEach((port) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    socket.on('message', onMessage);
    socket.on('error', (err) => {
      portErrors[port] = err && err.message ? err.message : 'unknown';
      logger.info(`[Tuya][localScan] UDP socket error on port ${port}: ${err.message}`);
    });
    socket.on('listening', () => {
      try {
        const address = socket.address();
        logger.info(`[Tuya][localScan] Listening on ${address.address}:${address.port}`);
      } catch (e) {
        logger.info(`[Tuya][localScan] Listening on port ${port}`);
      }
    });
    socket.bind({ port, address: '0.0.0.0', exclusive: false });
    sockets.push(socket);
  });

  await new Promise((resolve) => {
    setTimeout(resolve, timeoutSeconds * 1000);
  });

  sockets.forEach((socket) => {
    try {
      socket.close();
    } catch (e) {
      // ignore
    }
  });

  logger.info(`[Tuya][localScan] Scan complete. Found ${Object.keys(devices).length} device(s).`);
  return { devices, portErrors };
}

/**
 * @description Build local scan response and update discovered devices.
 * @param {object} tuyaManager - Tuya handler instance.
 * @param {object} localScanResult - Result of UDP scan.
 * @returns {object} API response payload.
 * @example
 * buildLocalScanResponse(tuyaManager, { devices: {}, portErrors: {} });
 */
function buildLocalScanResponse(tuyaManager, localScanResult) {
  const localDevicesById = (localScanResult && localScanResult.devices) || {};
  const portErrors = (localScanResult && localScanResult.portErrors) || {};
  const mergeWithExisting = (device) => {
    if (!tuyaManager || !tuyaManager.gladys || !tuyaManager.gladys.stateManager) {
      return device;
    }
    const existing = normalizeExistingDevice(
      tuyaManager.gladys.stateManager.get('deviceByExternalId', device.external_id),
    );
    const withLocalOverride = applyExistingLocalOverride(device, existing);
    return mergeDevices(withLocalOverride, existing);
  };
  const buildLocalDiscoveredDevice = (deviceId, localInfo) =>
    convertDevice.call(tuyaManager, {
      id: deviceId,
      name: localInfo && localInfo.name ? localInfo.name : `Tuya ${deviceId}`,
      product_key: localInfo && localInfo.productKey,
      ip: localInfo && localInfo.ip,
      protocol_version: localInfo && localInfo.version,
      local_override: true,
      specifications: {
        functions: [],
        status: [],
      },
      tuya_report: buildLocalScanReport(localInfo),
    });

  if (tuyaManager && Array.isArray(tuyaManager.discoveredDevices)) {
    const updatedDevices = tuyaManager.discoveredDevices.map((device) => {
      const deviceId = device.external_id && device.external_id.split(':')[1];
      const localInfo = localDevicesById[deviceId];
      return updateDiscoveredDeviceWithLocalInfo(device, localInfo);
    });
    const mergedDevices = updatedDevices.map((device) => mergeWithExisting(device));
    const knownExternalIds = new Set(mergedDevices.map((device) => device.external_id));
    const localOnlyDevices = Object.entries(localDevicesById)
      .map(([deviceId, localInfo]) => buildLocalDiscoveredDevice(deviceId, localInfo))
      .filter((device) => !knownExternalIds.has(device.external_id))
      .map((device) => mergeWithExisting(device));
    const allDiscoveredDevices = [...mergedDevices, ...localOnlyDevices];
    tuyaManager.discoveredDevices = allDiscoveredDevices;
    return {
      devices: allDiscoveredDevices,
      local_devices: localDevicesById,
      port_errors: portErrors,
    };
  }

  if (tuyaManager && Object.keys(localDevicesById).length > 0) {
    const localDiscoveredDevices = Object.entries(localDevicesById)
      .map(([deviceId, localInfo]) => buildLocalDiscoveredDevice(deviceId, localInfo))
      .map((device) => mergeWithExisting(device));
    tuyaManager.discoveredDevices = localDiscoveredDevices;
    return {
      devices: localDiscoveredDevices,
      local_devices: localDevicesById,
      port_errors: portErrors,
    };
  }

  return {
    local_devices: localDevicesById,
    port_errors: portErrors,
  };
}

module.exports = {
  localScan,
  buildLocalScanResponse,
};
