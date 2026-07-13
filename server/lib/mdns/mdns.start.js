// @ts-ignore
const multicastDns = require('multicast-dns');

const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const {
  DEFAULT_MDNS_HOSTNAME,
  MDNS_SERVICE_NAME,
  HTTP_SERVICE_TYPE,
  MDNS_TTL,
  MDNS_HOSTNAME_REGEX,
} = require('./mdns.constants');

/**
 * @description Sanitize the mDNS hostname configured by the user.
 * @param {string|null} rawValue - The raw value of the MDNS_HOSTNAME variable.
 * @returns {string} A valid mDNS hostname, without the ".local" suffix.
 * @example
 * sanitizeHostname('gladys-garage.local');
 */
function sanitizeHostname(rawValue) {
  if (!rawValue) {
    return DEFAULT_MDNS_HOSTNAME;
  }
  let hostname = rawValue.trim().toLowerCase();
  if (hostname.endsWith('.local')) {
    hostname = hostname.slice(0, -'.local'.length);
  }
  if (!MDNS_HOSTNAME_REGEX.test(hostname)) {
    logger.warn(`mDNS: invalid hostname "${rawValue}", falling back to "${DEFAULT_MDNS_HOSTNAME}"`);
    return DEFAULT_MDNS_HOSTNAME;
  }
  return hostname;
}

/**
 * @description Advertise Gladys on the local network with mDNS, as http://<hostname>.local.
 * @param {number} port - Port of the Gladys web server.
 * @returns {Promise} Resolve when the advertisement is started.
 * @example
 * await mdns.start(80);
 */
async function start(port) {
  this.port = port;
  const rawHostname = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.MDNS_HOSTNAME);
  this.hostname = sanitizeHostname(rawHostname);
  this.fqdn = `${this.hostname}.local`;
  const instanceName =
    this.hostname === DEFAULT_MDNS_HOSTNAME ? MDNS_SERVICE_NAME : `${MDNS_SERVICE_NAME} (${this.hostname})`;
  this.instanceFqdn = `${instanceName}.${HTTP_SERVICE_TYPE}`;
  try {
    this.mdns = multicastDns();
    this.mdns.on('error', (/** @type {any} */ error) => {
      logger.warn('mDNS: network error while advertising Gladys');
      logger.warn(error);
    });
    this.mdns.on('warning', (/** @type {any} */ error) => {
      logger.debug('mDNS: warning while advertising Gladys');
      logger.debug(error);
    });
    this.mdns.on('query', (/** @type {any} */ query) => {
      try {
        this.handleQuery(query);
      } catch (e) {
        logger.warn(e);
      }
    });
    // unsolicited announcements at startup, sent twice one second apart (RFC 6762)
    const announce = () => {
      const records = this.getRecords(MDNS_TTL);
      if (this.mdns !== null && records.length > 0) {
        this.mdns.respond({ answers: records });
      }
    };
    announce();
    this.announceTimeout = setTimeout(announce, 1000);
    logger.info(`mDNS: advertising Gladys as http://${this.fqdn}:${port}`);
  } catch (e) {
    logger.warn('mDNS: unable to advertise Gladys on the local network');
    logger.warn(e);
    this.mdns = null;
  }
}

module.exports = {
  start,
};
