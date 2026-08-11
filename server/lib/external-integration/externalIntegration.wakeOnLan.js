const dgram = require('dgram');
const net = require('net');
const { BadParameters } = require('../../utils/coreErrors');

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
    throw new Error('Invalid MAC address');
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
 * @param {object} options - Wake-on-LAN options.
 * @param {string} options.mac - Target MAC address.
 * @param {string} [options.address] - Destination/broadcast address.
 * @param {number} [options.port] - Destination UDP port.
 * @param {number} [options.sourcePort] - Source UDP port.
 * @returns {Promise<void>} Promise that resolves when the magic packet is sent.
 * @example
 * await wakeOnLan({ mac: '00:11:22:33:44:55' });
 */
async function wakeOnLan({ mac, address = DEFAULT_ADDRESS, port = DEFAULT_PORT, sourcePort = 0 }) {
  if (typeof mac !== 'string') {
    throw new BadParameters('mac is required');
  }

  if (address !== undefined && net.isIPv4(address) === false) {
    throw new BadParameters('address must be a valid IPv4 address');
  }

  if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    throw new BadParameters('port must be between 1 and 65535');
  }

  if (sourcePort !== undefined && (!Number.isInteger(sourcePort) || sourcePort < 0 || sourcePort > 65535)) {
    throw new BadParameters('sourcePort must be between 0 and 65535');
  }
  const payload = buildMagicPacket(mac);

  const socket = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true,
  });

  await new Promise((resolve, reject) => {
    socket.once('error', reject);

    socket.bind(sourcePort, () => {
      try {
        socket.setBroadcast(true);

        socket.send(payload, port, address, (error) => {
          socket.close();

          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      } catch (error) {
        socket.close();
        reject(error);
      }
    });
  });
}

module.exports = {
  wakeOnLan,
};
