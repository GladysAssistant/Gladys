const dgram = require('dgram');
const os = require('os');

const logger = require('../../../utils/logger');

// Docker-side interfaces: their broadcast never reaches the LAN, and
// spraying the integration bridges would be exactly the traffic this
// mediation exists to avoid
const DOCKER_INTERFACE_PREFIXES = ['docker', 'br-', 'veth'];

/**
 * @description Compute the broadcast addresses to emit on: the limited
 * broadcast plus the directed broadcast of each external IPv4 interface
 * (ip | ~netmask), skipping Docker bridges — some LAN stacks only answer
 * one of the two forms.
 * @returns {Array} The broadcast addresses, deduplicated.
 * @example
 * const addresses = getBroadcastAddresses();
 */
function getBroadcastAddresses() {
  const addresses = new Set(['255.255.255.255']);
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach((interfaceName) => {
    if (DOCKER_INTERFACE_PREFIXES.some((prefix) => interfaceName.startsWith(prefix))) {
      return;
    }
    interfaces[interfaceName].forEach((networkInterface) => {
      if (networkInterface.family !== 'IPv4' || networkInterface.internal) {
        return;
      }
      const ipParts = networkInterface.address.split('.').map(Number);
      const maskParts = networkInterface.netmask.split('.').map(Number);
      // eslint-disable-next-line no-bitwise
      addresses.add(ipParts.map((ipPart, index) => ipPart | (~maskParts[index] & 0xff)).join('.'));
    });
  });
  return [...addresses];
}

/**
 * @description Active query/response broadcast from the network=host
 * position of the core (the TP-Link Kasa case: the discovery request must
 * be broadcast on the LAN and the devices answer unicast to the sender —
 * a role only the core can play, a bridge container broadcast never
 * traverses the NAT). The integration forges the payload and parses the
 * replies itself — the core emits and relays raw bytes, nothing more.
 * @param {object} options - Scan options.
 * @param {number} options.port - The declared UDP port to broadcast on.
 * @param {Buffer} options.payload - The payload forged by the integration.
 * @param {number} options.timeoutMs - Reply collection duration in milliseconds.
 * @param {Array} [options.addresses] - Broadcast addresses override (tests).
 * @param {string} [options.bindAddress] - Local bind address override (tests).
 * @returns {Promise<Array>} Resolve with [{ source_ip, source_port, payload_base64 }].
 * @example
 * const results = await gladys.externalIntegration.scanUdpActiveBroadcast({
 *   port: 9999,
 *   payload: Buffer.from('...'),
 *   timeoutMs: 5000,
 * });
 */
async function scanUdpActiveBroadcast({ port, payload, timeoutMs, addresses = getBroadcastAddresses(), bindAddress }) {
  const results = [];
  // a scan never throws: an unsendable broadcast (no route, firewall...)
  // simply collects nothing
  const onSocketError = (e) => {
    logger.debug('External integration network discovery: UDP active scan error', e);
  };
  const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  socket.on('error', onSocketError);
  socket.on('message', (replyPayload, remoteInfo) => {
    results.push({
      source_ip: remoteInfo.address,
      source_port: remoteInfo.port,
      payload_base64: replyPayload.toString('base64'),
    });
  });
  // ephemeral port: the devices answer unicast to the emitter, so the
  // replies come back straight to this socket
  const bound = await new Promise((resolve) => {
    socket.once('error', () => resolve(false));
    socket.bind({ port: 0, address: bindAddress }, () => resolve(true));
  });
  if (!bound) {
    return results;
  }
  try {
    socket.setBroadcast(true);
    addresses.forEach((address) => {
      socket.send(payload, port, address, (e) => {
        if (e) {
          onSocketError(e);
        }
      });
    });
  } catch (e) {
    onSocketError(e);
  }
  await new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
  socket.close();
  return results;
}

module.exports = {
  scanUdpActiveBroadcast,
  getBroadcastAddresses,
};
