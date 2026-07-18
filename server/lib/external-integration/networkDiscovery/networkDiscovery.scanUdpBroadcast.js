const dgram = require('dgram');

const logger = require('../../../utils/logger');

/**
 * @description Passive capture of UDP broadcasts on the declared ports,
 * from the network=host position of the core. The payloads are returned
 * raw (base64): the integration interprets them itself (the Tuya case:
 * its MessageParser over the local scan announcements).
 * @param {object} options - Scan options.
 * @param {Array} options.ports - The declared UDP ports to listen on.
 * @param {number} options.timeoutMs - Capture duration in milliseconds.
 * @returns {Promise<Array>} Resolve with [{ source_ip, source_port, payload_base64 }].
 * @example
 * const results = await gladys.externalIntegration.scanUdpBroadcast({ ports: [6666, 6667], timeoutMs: 10000 });
 */
async function scanUdpBroadcast({ ports, timeoutMs }) {
  const results = [];
  const sockets = ports.map((port) => {
    // reuseAddr: the core (or another integration scan) may already be
    // bound on the same announcement port
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    socket.on('message', (payload, remoteInfo) => {
      results.push({
        source_ip: remoteInfo.address,
        source_port: remoteInfo.port,
        payload_base64: payload.toString('base64'),
      });
    });
    socket.on('error', (e) => {
      // a port already bound without reuse, or a firewall refusal: the
      // capture goes on with the other ports, a scan never throws
      logger.debug(`External integration network discovery: UDP capture error on port ${port}`, e);
    });
    socket.bind(port);
    return socket;
  });
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    if (timer.unref) {
      timer.unref();
    }
  });
  sockets.forEach((socket) => {
    try {
      socket.close();
    } catch (e) {
      logger.debug(e);
    }
  });
  return results;
}

module.exports = {
  scanUdpBroadcast,
};
