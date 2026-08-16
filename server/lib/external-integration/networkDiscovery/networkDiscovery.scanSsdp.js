const dgram = require('dgram');
const fs = require('fs/promises');

const logger = require('../../../utils/logger');

const SSDP_MULTICAST_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;
const ARP_TABLE_PATH = '/proc/net/arp';
// an incomplete neighbour entry is listed with an all-zero hardware address
const EMPTY_MAC_ADDRESS = '00:00:00:00:00:00';
const MAC_ADDRESS_REGEX = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;

/**
 * @description Read the kernel neighbour (ARP) table of the core, which
 * runs network=host: an IP that just answered a scan is in it. Reading it
 * is best-effort — a non-Linux host, a missing /proc or an entry the
 * kernel never resolved simply yields no MAC, never an error.
 * @param {string} [arpTablePath] - Path of the kernel ARP table (tests only).
 * @returns {Promise<Map>} Resolve with a Map of IPv4 address -> MAC address.
 * @example
 * const macByIp = await readArpTable();
 */
async function readArpTable(arpTablePath = ARP_TABLE_PATH) {
  const macByIp = new Map();
  let table;
  try {
    table = await fs.readFile(arpTablePath, 'utf8');
  } catch (e) {
    logger.debug('External integration network discovery: unable to read the ARP table', e);
    return macByIp;
  }
  // first line is the header: "IP address HW type Flags HW address Mask Device"
  table
    .split('\n')
    .slice(1)
    .forEach((line) => {
      const [ip, , , mac] = line.trim().split(/\s+/);
      if (!ip || !mac || mac === EMPTY_MAC_ADDRESS || !MAC_ADDRESS_REGEX.test(mac)) {
        return;
      }
      macByIp.set(ip, mac.toLowerCase());
    });
  return macByIp;
}

/**
 * @description Active SSDP discovery: send an M-SEARCH for the declared
 * search target and collect the raw response headers of each responder.
 * The integration parses the headers itself. Each responder IP is also
 * looked up in the neighbour table, and `source_mac` is added when the
 * kernel already knows it — the integration gets a stable identifier
 * (Wake-on-LAN, matching across DHCP leases) without asking the user.
 * @param {object} options - Scan options.
 * @param {string} options.st - The declared SSDP search target.
 * @param {number} options.timeoutMs - Listen duration in milliseconds.
 * @param {string} [options.address] - Target address (tests only).
 * @param {number} [options.port] - Target port (tests only).
 * @param {string} [options.arpTablePath] - Path of the kernel ARP table (tests only).
 * @returns {Promise<Array>} Resolve with [{ source_ip, source_mac?, source_port, headers }] (headers = raw response).
 * @example
 * const results = await gladys.externalIntegration.scanSsdp({ st: 'ssdp:all', timeoutMs: 5000 });
 */
async function scanSsdp({
  st,
  timeoutMs,
  address = SSDP_MULTICAST_ADDRESS,
  port = SSDP_PORT,
  arpTablePath = ARP_TABLE_PATH,
}) {
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
  // the socket is always implicitly bound by the send, even when the
  // M-SEARCH itself failed: close never throws here
  socket.close();
  // the neighbour table is read once, after the scan: the responders have
  // just talked to us, so the kernel resolved them on the way
  const macByIp = await readArpTable(arpTablePath);
  return results.map((result) => {
    const mac = macByIp.get(result.source_ip);
    if (!mac) {
      return result;
    }
    return { source_ip: result.source_ip, source_mac: mac, source_port: result.source_port, headers: result.headers };
  });
}

module.exports = {
  scanSsdp,
  readArpTable,
};
