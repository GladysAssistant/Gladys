const dgram = require('dgram');

const logger = require('../../../utils/logger');

const SSDP_MULTICAST_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;

/**
 * @description Active SSDP discovery: send an M-SEARCH for the declared
 * search target and collect the raw response headers of each responder.
 * The integration parses the headers itself.
 * @param {object} options - Scan options.
 * @param {string} options.st - The declared SSDP search target.
 * @param {number} options.timeoutMs - Listen duration in milliseconds.
 * @param {string} [options.address] - Target address (tests only).
 * @param {number} [options.port] - Target port (tests only).
 * @returns {Promise<Array>} Resolve with [{ source_ip, source_port, headers }] (headers = raw response).
 * @example
 * const results = await gladys.externalIntegration.scanSsdp({ st: 'ssdp:all', timeoutMs: 5000 });
 */
async function scanSsdp({ st, timeoutMs, address = SSDP_MULTICAST_ADDRESS, port = SSDP_PORT }) {
  const results = [];
  const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  socket.on('message', (payload, remoteInfo) => {
    results.push({
      source_ip: remoteInfo.address,
      source_port: remoteInfo.port,
      headers: payload.toString('utf8'),
    });
  });
  // a scan never throws: an unreachable network simply returns nothing
  const onSocketError = (e) => {
    logger.debug('External integration network discovery: SSDP capture error', e);
  };
  socket.on('error', onSocketError);
  const mSearch = Buffer.from(
    [
      'M-SEARCH * HTTP/1.1',
      `HOST: ${SSDP_MULTICAST_ADDRESS}:${SSDP_PORT}`,
      'MAN: "ssdp:discover"',
      `MX: ${Math.max(1, Math.min(5, Math.floor(timeoutMs / 1000)))}`,
      `ST: ${st}`,
      '',
      '',
    ].join('\r\n'),
  );
  socket.send(mSearch, 0, mSearch.length, port, address, (e) => {
    if (e) {
      onSocketError(e);
    }
  });
  await new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
  try {
    socket.close();
  } catch (e) {
    logger.debug(e);
  }
  return results;
}

module.exports = {
  scanSsdp,
};
