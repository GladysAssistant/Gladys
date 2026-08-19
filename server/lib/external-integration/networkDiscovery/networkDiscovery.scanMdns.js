const multicastDns = require('multicast-dns');

const logger = require('../../../utils/logger');

/**
 * @description Browse the declared DNS-SD service types through mDNS: send
 * PTR queries and aggregate the announced instances (SRV/TXT/A/AAAA records)
 * during the scan window. Records are returned as-is (name, host,
 * addresses, port, txt): the integration interprets them itself.
 * @param {object} options - Scan options.
 * @param {string} [options.service] - A single declared DNS-SD service type (backward-compatible form).
 * @param {Array<string>} [options.services] - The declared DNS-SD service types.
 * @param {number} options.timeoutMs - Listen duration in milliseconds.
 * @param {object} [options.mdnsOptions] - Options passed to multicast-dns (tests only).
 * @returns {Promise<Array>} Resolve with [{ name, host, addresses, port, txt }].
 * @example
 * const results = await gladys.externalIntegration.scanMdns({ service: '_hue._tcp', timeoutMs: 5000 });
 */
async function scanMdns({ service, services, timeoutMs, mdnsOptions }) {
  const serviceNames = (services || [service]).map((declaredService) => `${declaredService}.local`);
  // service name -> instance name -> { name, host, addresses, port, txt }
  const instancesByServiceName = new Map(serviceNames.map((serviceName) => [serviceName, new Map()]));
  const addressesByHost = new Map();
  let mdns;
  try {
    mdns = multicastDns(mdnsOptions);
  } catch (e) {
    // a scan never throws: an unreachable network simply returns nothing
    logger.debug('External integration network discovery: unable to open the mDNS socket', e);
    return [];
  }
  const getInstance = (serviceName, instanceName) => {
    const instances = instancesByServiceName.get(serviceName);
    if (!instances.has(instanceName)) {
      instances.set(instanceName, { name: instanceName, host: null, addresses: [], port: null, txt: [] });
    }
    return instances.get(instanceName);
  };
  mdns.on('response', (response) => {
    const records = [...(response.answers || []), ...(response.additionals || [])];
    records.forEach((record) => {
      const matchingServiceName = serviceNames.find((serviceName) => record.name.endsWith(`.${serviceName}`));
      // the socket sees every mDNS packet on the network, not only the
      // answers to our PTR query: SRV/TXT records of foreign services
      // (unsolicited announcements) must never create an instance, or the
      // scan would return arbitrary hosts/ports of the whole network
      if (record.type === 'PTR' && serviceNames.includes(record.name)) {
        getInstance(record.name, record.data);
      } else if (record.type === 'SRV' && matchingServiceName) {
        const instance = getInstance(matchingServiceName, record.name);
        instance.host = record.data.target;
        instance.port = record.data.port;
      } else if (record.type === 'TXT' && matchingServiceName) {
        const entries = Array.isArray(record.data) ? record.data : [record.data];
        getInstance(matchingServiceName, record.name).txt = entries.map((entry) => entry.toString('utf8'));
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
  serviceNames.forEach((name) => {
    mdns.query({ questions: [{ name, type: 'PTR' }] });
  });
  await new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
  // multicast-dns destroy is safe even when the underlying socket
  // failed to bind (it just closes it and calls back)
  await new Promise((resolve) => {
    mdns.destroy(resolve);
  });
  return serviceNames.flatMap((serviceName) =>
    [...instancesByServiceName.get(serviceName).values()].map((instance) => ({
      ...instance,
      addresses: instance.host ? addressesByHost.get(instance.host) || [] : [],
    })),
  );
}

module.exports = {
  scanMdns,
};
