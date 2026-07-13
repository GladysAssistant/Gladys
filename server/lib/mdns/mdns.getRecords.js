const os = require('os');

const { getLocalIp } = require('../system/system.getInfos');
const { HTTP_SERVICE_TYPE } = require('./mdns.constants');

/**
 * @description Build the mDNS records advertising Gladys (service discovery + hostname).
 * @param {number} ttl - Time-to-live of the records, 0 for goodbye packets.
 * @returns {Array<any>} The DNS records, or an empty array if no local IP is available.
 * @example
 * mdns.getRecords(120);
 */
function getRecords(ttl) {
  const localIp = getLocalIp(os.networkInterfaces());
  if (localIp === null) {
    return [];
  }
  // the cache-flush bit should not be set on goodbye packets (RFC 6762)
  const flush = ttl > 0;
  return [
    {
      name: HTTP_SERVICE_TYPE,
      type: 'PTR',
      ttl,
      data: this.instanceFqdn,
    },
    {
      name: this.instanceFqdn,
      type: 'SRV',
      ttl,
      flush,
      data: {
        target: this.fqdn,
        port: this.port,
        priority: 0,
        weight: 0,
      },
    },
    {
      name: this.instanceFqdn,
      type: 'TXT',
      ttl,
      flush,
      data: [],
    },
    {
      name: this.fqdn,
      type: 'A',
      ttl,
      flush,
      data: localIp,
    },
  ];
}

module.exports = {
  getRecords,
};
