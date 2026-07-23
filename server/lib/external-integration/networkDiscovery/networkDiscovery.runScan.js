const { BadParameters, ForbiddenError, ConflictError, TooManyRequests } = require('../../../utils/coreErrors');
const {
  NETWORK_DISCOVERY_TYPES,
  NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS,
  MAX_ACTIVE_BROADCAST_PAYLOAD_BYTES,
  ACTIVE_BROADCAST_MIN_INTERVAL_MS,
} = require('../constants');

/**
 * @description Run a mediated network discovery scan on behalf of an
 * integration (POST /network_discovery/scan of the host API). The core
 * captures — and, for the active type, emits — from its network=host
 * position; the integration interprets the raw results (and forges the
 * active payload) itself — the core never parses nor builds anything.
 * The scan is strictly bounded by the authorization contract of the
 * manifest: a type (and its ports/service/st) not declared in
 * `network_discovery` is a 403, and one scan at a time per integration
 * (sockets only open during the scan, cost bounded by the timeout).
 * The active emission has its own guardrails (the core sends a packet
 * forged by a third party, the primitive must stay uninteresting to
 * hijack): broadcast only — never a chosen unicast target —, declared
 * ports only, payload bounded to 512 decoded bytes, and one scan per 10
 * seconds per integration (429 otherwise) — no targeting, no port
 * sweep, no volume.
 * @param {object} service - The external integration service.
 * @param {object} body - The scan request.
 * @param {string} body.type - Capture type (udp-broadcast, udp-active-broadcast, mdns or ssdp).
 * @param {number} [body.timeout_seconds] - Scan duration, 1-30s (default 10).
 * @param {number} [body.port] - Active scan only: the declared UDP port to broadcast on.
 * @param {string} [body.payload_base64] - Active scan only: the payload to broadcast.
 * @returns {Promise<Array>} Resolve with the raw capture results.
 * @example
 * const results = await gladys.externalIntegration.runNetworkDiscoveryScan(service, { type: 'udp-broadcast' });
 */
async function runNetworkDiscoveryScan(
  service,
  { type, timeout_seconds: timeoutSeconds, port, payload_base64: payloadBase64 } = {},
) {
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
  let payload = null;
  if (type === 'udp-active-broadcast') {
    if (!Number.isInteger(port)) {
      throw new BadParameters('port: must be an integer');
    }
    // emitting is bounded by the same authorization contract as
    // capturing: never a port the user did not approve
    if (!capture.ports.includes(port)) {
      throw new ForbiddenError(`network_discovery: port ${port} is not declared in the manifest`);
    }
    if (typeof payloadBase64 !== 'string' || payloadBase64.length === 0) {
      throw new BadParameters('payload_base64: must be a non-empty base64 string');
    }
    payload = Buffer.from(payloadBase64, 'base64');
    if (payload.length === 0 || payload.length > MAX_ACTIVE_BROADCAST_PAYLOAD_BYTES) {
      throw new BadParameters(`payload_base64: must decode to 1-${MAX_ACTIVE_BROADCAST_PAYLOAD_BYTES} bytes`);
    }
    const lastScanAt = this.networkDiscoveryActiveScanTimes.get(service.id);
    if (lastScanAt !== undefined && Date.now() - lastScanAt < ACTIVE_BROADCAST_MIN_INTERVAL_MS) {
      throw new TooManyRequests(
        `RATE_LIMIT_EXCEEDED: max 1 active scan per ${ACTIVE_BROADCAST_MIN_INTERVAL_MS / 1000} seconds`,
        Math.ceil((lastScanAt + ACTIVE_BROADCAST_MIN_INTERVAL_MS - Date.now()) / 1000),
      );
    }
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
    if (type === 'udp-active-broadcast') {
      this.networkDiscoveryActiveScanTimes.set(service.id, Date.now());
      return await this.scanUdpActiveBroadcast({ port, payload, timeoutMs });
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
