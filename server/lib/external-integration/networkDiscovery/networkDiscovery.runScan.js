const { BadParameters, ForbiddenError, ConflictError } = require('../../../utils/coreErrors');
const {
  NETWORK_DISCOVERY_TYPES,
  NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS,
} = require('../constants');

/**
 * @description Run a mediated network discovery scan on behalf of an
 * integration (POST /network_discovery/scan of the host API). The core
 * captures from its network=host position, the integration interprets the
 * raw results itself — the core never parses anything. The capture is
 * strictly bounded by the authorization contract of the manifest: a type
 * (and its ports/service/st) not declared in `network_discovery` is a 403,
 * and one scan at a time per integration (sockets only open during the
 * scan, cost bounded by the timeout).
 * @param {object} service - The external integration service.
 * @param {object} body - The scan request.
 * @param {string} body.type - Capture type (udp-broadcast, mdns or ssdp).
 * @param {number} [body.timeout_seconds] - Scan duration, 1-30s (default 10).
 * @returns {Promise<Array>} Resolve with the raw capture results.
 * @example
 * const results = await gladys.externalIntegration.runNetworkDiscoveryScan(service, { type: 'udp-broadcast' });
 */
async function runNetworkDiscoveryScan(service, { type, timeout_seconds: timeoutSeconds } = {}) {
  if (!NETWORK_DISCOVERY_TYPES.includes(type)) {
    throw new BadParameters(`type: must be one of ${NETWORK_DISCOVERY_TYPES.join(', ')}`);
  }
  const effectiveTimeoutSeconds =
    timeoutSeconds === undefined ? NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS : timeoutSeconds;
  if (
    !Number.isInteger(effectiveTimeoutSeconds) ||
    effectiveTimeoutSeconds < NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS ||
    effectiveTimeoutSeconds > NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS
  ) {
    throw new BadParameters(
      `timeout_seconds: must be an integer between ${NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS} and ${NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS}`,
    );
  }
  const declaredCaptures = (service.manifest && service.manifest.network_discovery) || [];
  const capture = declaredCaptures.find((entry) => entry.type === type);
  if (!capture) {
    throw new ForbiddenError(`network_discovery: capture type ${type} is not declared in the manifest`);
  }
  if (this.networkDiscoveryScans.has(service.id)) {
    throw new ConflictError('EXTERNAL_INTEGRATION_SCAN_ALREADY_RUNNING');
  }
  this.networkDiscoveryScans.add(service.id);
  const timeoutMs = effectiveTimeoutSeconds * 1000;
  try {
    if (type === 'udp-broadcast') {
      return await this.scanUdpBroadcast({ ports: capture.ports, timeoutMs });
    }
    if (type === 'mdns') {
      return await this.scanMdns({ service: capture.service, timeoutMs });
    }
    return await this.scanSsdp({ st: capture.st, timeoutMs });
  } finally {
    this.networkDiscoveryScans.delete(service.id);
  }
}

module.exports = {
  runNetworkDiscoveryScan,
};
