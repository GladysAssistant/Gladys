const dgram = require('dgram');
const { UDP_KEY } = require('tuyapi/lib/config');
const { MessageParser } = require('tuyapi/lib/message-parser');
const logger = require('../../../utils/logger');

const DEFAULT_PORTS = [6666, 6667, 7000];

/**
 * @description Scan local network for Tuya devices over UDP to retrieve protocol version.
 * @param {number} timeoutSeconds - Scan duration in seconds.
 * @returns {Promise<object>} Map of deviceId -> { ip, version, productKey }.
 * @example
 * await localScan(5);
 */
async function localScan(timeoutSeconds = 10) {
  const devices = {};
  const sockets = [];
  const parser = new MessageParser({ key: UDP_KEY, version: 3.1 });
  logger.info(`[Tuya][localScan] Starting UDP scan for ${timeoutSeconds}s on ports ${DEFAULT_PORTS.join(', ')}`);

  const onMessage = (message) => {
    let payload;
    try {
      const parsed = parser.parse(message);
      payload = parsed && parsed[0] && parsed[0].payload;
    } catch (e) {
      return;
    }

    if (!payload || typeof payload !== 'object') {
      return;
    }

    const { gwId, devId, id, ip, version, productKey } = payload;
    const deviceId = gwId || devId || id;

    if (!deviceId) {
      return;
    }

    const isNew = !devices[deviceId];
    devices[deviceId] = {
      ip,
      version,
      productKey,
    };
    if (isNew) {
      logger.debug(`[Tuya][localScan] Found device ${deviceId} ip=${ip || 'unknown'} version=${version || 'unknown'}`);
    }
  };

  DEFAULT_PORTS.forEach((port) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    socket.on('message', onMessage);
    socket.on('error', (err) => {
      logger.debug(`[Tuya][localScan] UDP socket error on port ${port}: ${err.message}`);
    });
    socket.bind(port, () => {
      try {
        const address = socket.address();
        logger.info(`[Tuya][localScan] Listening on ${address.address}:${address.port}`);
      } catch (e) {
        logger.info(`[Tuya][localScan] Listening on port ${port}`);
      }
    });
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
  return devices;
}

module.exports = {
  localScan,
};
