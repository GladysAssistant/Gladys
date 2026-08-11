const dgram = require('dgram');
const net = require('net');

const { BadParameters, ForbiddenError } = require('../../utils/coreErrors');

const DEFAULT_PORT = 9;
const DEFAULT_ADDRESS = '255.255.255.255';

/**
 * @description Normalize a MAC address to a Buffer.
 * @param {string} mac - MAC address in format xx:xx:xx:xx:xx:xx.
 * @returns {Buffer<ArrayBuffer>} - MAC address as a Buffer.
 * @example
 * normalizeMac('00:11:22:33:44:55');
 */
function normalizeMac(mac) {
  const normalized = mac.replace(/[:-]/g, '');

  if (!/^[0-9a-fA-F]{12}$/.test(normalized)) {
    throw new BadParameters('Invalid MAC address');
  }

  return Buffer.from(normalized, 'hex');
}

/**
 * @description Build a Wake-on-LAN magic packet.
 * @param {string} mac - MAC address in format xx:xx:xx:xx:xx:xx.
 * @returns {Buffer<ArrayBuffer>} Magic packet as a Buffer.
 * @example
 * buildMagicPacket('00:11:22:33:44:55');
 */
function buildMagicPacket(mac) {
  const macBuffer = normalizeMac(mac);

  return Buffer.concat([Buffer.alloc(6, 0xff), ...Array.from({ length: 16 }, () => macBuffer)]);
}

/**
 * @description Send a Wake-on-LAN magic packet to a target device.
 * @param {object} service - The external integration service (plain object).
 * @param {object} service.manifest - The external integration manifest.
 * @param {boolean} [service.manifest.network_wake] - Whether Wake-on-LAN is allowed for this integration.
 * @param {object} options - Wake-on-LAN options.
 * @param {string} options.mac - Target MAC address.
 * @param {string} [options.address] - Destination/broadcast address.
 * @param {number} [options.port] - Destination UDP port.
 * @param {number} [options.sourcePort] - Source UDP port.
 * @returns {Promise<void>} Promise that resolves when the magic packet is sent.
 * @example
 * await gladys.externalIntegration.wakeOnLan(service, { mac: '00:11:22:33:44:55' });
 */
async function wakeOnLan(service, options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new BadParameters('Invalid Wake-on-LAN options');
  }

  const { mac, address = DEFAULT_ADDRESS, port = DEFAULT_PORT, sourcePort = DEFAULT_PORT } = options;

  if (!net.isIPv4(address)) {
    throw new BadParameters('Invalid IPv4 address');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new BadParameters('port: must be an integer between 1 and 65535');
  }

  if (!Number.isInteger(sourcePort) || sourcePort < 0 || sourcePort > 65535) {
    throw new BadParameters('sourcePort: must be an integer between 0 and 65535');
  }

  if (!service.manifest?.network_wake) {
    throw new ForbiddenError('Wake-on-LAN is not allowed for this integration');
  }
  const payload = buildMagicPacket(mac);

  const socket = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true,
  });

  await new Promise((resolve, reject) => {
    let settled = false;

    const close = (callback) => {
      if (socket) {
        socket.close(callback);
      } else {
        callback();
      }
    };

    const fail = (error) => {
      if (settled) {
        return;
      }

      settled = true;

      close(() => {
        reject(error);
      });
    };

    socket.once('error', fail);

    socket.bind(sourcePort, () => {
      try {
        socket.setBroadcast(true);

        socket.send(payload, port, address, (error) => {
          if (settled) {
            return;
          }

          if (error) {
            fail(error);
            return;
          }

          settled = true;

          socket.close(() => {
            resolve();
          });
        });
      } catch (error) {
        fail(error);
      }
    });
  });
}

module.exports = {
  wakeOnLan,
};
