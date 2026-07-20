const multicastDns = require('multicast-dns');

const logger = require('../../../utils/logger');

/**
 * @description mDNS browse of the declared DNS-SD service type: send a PTR
 * query and aggregate the announced instances (SRV/TXT/A/AAAA records)
 * during the scan window. Records are returned as-is (name, host,
 * addresses, port, txt): the integration interprets them itself.
 * @param {object} options - Scan options.
 * @param {string} options.service - The declared DNS-SD service type (e.g. _hue._tcp).
 * @param {number} options.timeoutMs - Listen duration in milliseconds.
 * @param {object} [options.mdnsOptions] - Options passed to multicast-dns (tests only).
 * @returns {Promise<Array>} Resolve with [{ name, host, addresses, port, txt }].
 * @example
 * const results = await gladys.externalIntegration.scanMdns({ service: '_hue._tcp', timeoutMs: 5000 });
 */
async function scanMdns({ service, timeoutMs, mdnsOptions }) {
  const serviceName = `${service}.local`;
  // instance name -> { name, host, addresses, port, txt }
  const instances = new Map();
  const addressesByHost = new Map();
  let mdns;
  try {
    mdns = multicastDns(mdnsOptions);
  } catch (e) {
    // a scan never throws: an unreachable network simply returns nothing
    logger.debug('External integration network discovery: unable to open the mDNS socket', e);
    return [];
  }
  const getInstance = (name) => {
    if (!instances.has(name)) {
      instances.set(name, { name, host: null, addresses: [], port: null, txt: [] });
    }
    return instances.get(name);
  };
  mdns.on('response', (response) => {
    const records = [...(response.answers || []), ...(response.additionals || [])];
    records.forEach((record) => {
      if (record.type === 'PTR' && record.name === serviceName) {
        getInstance(record.data);
      } else if (record.type === 'SRV') {
        const instance = getInstance(record.name);
        instance.host = record.data.target;
        instance.port = record.data.port;
      } else if (record.type === 'TXT') {
        const entries = Array.isArray(record.data) ? record.data : [record.data];
        getInstance(record.name).txt = entries.map((entry) => entry.toString('utf8'));
      } else if (record.type === 'A' || record.type === 'AAAA') {
        if (!addressesByHost.has(record.name)) {
          addressesByHost.set(record.name, []);
        }
        addressesByHost.get(record.name).push(record.data);
      }
    });
  });
  mdns.on('error', (e) => {
    logger.debug('External integration network discovery: mDNS capture error', e);
  });
  mdns.query({ questions: [{ name: serviceName, type: 'PTR' }] });
  await new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
  // multicast-dns destroy is safe even when the underlying socket
  // failed to bind (it just closes it and calls back)
  await new Promise((resolve) => {
    mdns.destroy(resolve);
  });
  return [...instances.values()].map((instance) => ({
    ...instance,
    addresses: instance.host ? addressesByHost.get(instance.host) || [] : [],
  }));
}

module.exports = {
  scanMdns,
};
