const dgram = require('dgram');
const { UDP_KEY } = require('tuyapi/lib/config');
const { MessageParser } = require('tuyapi/lib/message-parser');
const logger = require('../../../utils/logger');

const DEFAULT_PORTS = [6666, 6667, 7000];
const formatHex = (buffer, maxLen = 128) => {
  if (!buffer || !buffer.length) {
    return '';
  }
  const slice = buffer.slice(0, maxLen);
  return slice.toString('hex').match(/.{1,2}/g).join(' ');
};

const formatAscii = (buffer, maxLen = 256) => {
  if (!buffer || !buffer.length) {
    return '';
  }
  const slice = buffer.slice(0, maxLen);
  return slice.toString('utf8').replace(/\s+/g, ' ').trim();
};

/**
 * @description Scan local network for Tuya devices (UDP broadcast).
 * @param {number|object} input - Scan duration in seconds or options.
 * @returns {Promise<object>} Map of deviceId -> { ip, version, productKey }.
 * @example
 * await localScan({ timeoutSeconds: 10 });
 */
async function localScan(input = 10) {
  const options = typeof input === 'object' ? input || {} : { timeoutSeconds: input };
  const timeoutSeconds = options.timeoutSeconds || 10;
  const devices = {};
  const portErrors = {};
  const sockets = [];
  const parser = new MessageParser({ key: UDP_KEY, version: 3.1 });

  logger.info(`[Tuya][localScan] Starting udp scan for ${timeoutSeconds}s on ports ${DEFAULT_PORTS.join(', ')}`);

  const onMessage = (message, rinfo) => {
    let payload;
    const byteLen = message ? message.length : 0;
    const remote = rinfo ? `${rinfo.address}:${rinfo.port}` : 'unknown';
    const source = rinfo && rinfo.source ? rinfo.source : 'udp';
    logger.info(
      `[Tuya][localScan] Packet received (${source}) from ${remote} len=${byteLen} hex=${formatHex(
        message,
      )} ascii="${formatAscii(message)}"`,
    );
    try {
      const parsed = parser.parse(message);
      logger.info(`[Tuya][localScan] Parsed packet from ${remote}: ${JSON.stringify(parsed)}`);
      payload = parsed && parsed[0] && parsed[0].payload;
    } catch (e) {
      logger.info(`[Tuya][localScan] Unable to parse payload from ${remote} (len=${byteLen}): ${e.message}`);
      return;
    }

    if (!payload || typeof payload !== 'object') {
      logger.info(`[Tuya][localScan] Ignoring payload from ${remote} (len=${byteLen}): invalid payload`);
      return;
    }

    const { gwId, devId, id, ip, version, productKey } = payload;
    const deviceId = gwId || devId || id;

    if (!deviceId) {
      logger.info(`[Tuya][localScan] Ignoring payload from ${remote} (len=${byteLen}): missing deviceId`);
      return;
    }

    const isNew = !devices[deviceId];
    devices[deviceId] = {
      ip,
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

module.exports = {
  localScan,
};
