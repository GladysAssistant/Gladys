const get = require('get-value');
const logger = require('../../utils/logger');
const { INTEGRATIONS_NETWORK_NAME, INTEGRATIONS_NETWORK_GATEWAY } = require('./constants');

/**
 * @description Compute the base URL of the host API as seen from an
 * integration container. Gladys in host network mode (standard install):
 * the bridge gateway is the host, and the subnet being pinned by IPAM the
 * gateway is deterministic (`172.30.0.1`); if the subnet was already taken,
 * the effective gateway is read with inspectNetwork. Gladys in bridge mode:
 * integrations reach Gladys through the embedded DNS of the custom bridge
 * (`gladys` alias, see ensureNetwork).
 * @returns {Promise<string>} Resolve with the base URL, without trailing slash.
 * @example
 * const hostApiUrl = await gladys.externalIntegration.getHostApiUrl();
 */
async function getHostApiUrl() {
  const serverPort = process.env.SERVER_PORT || '80';
  const networkMode = await this.system.getNetworkMode();
  if (networkMode !== 'host') {
    return `http://gladys:${serverPort}`;
  }
  let gateway = INTEGRATIONS_NETWORK_GATEWAY;
  try {
    const network = await this.system.inspectNetwork(INTEGRATIONS_NETWORK_NAME);
    gateway = get(network, 'IPAM.Config.0.Gateway') || gateway;
  } catch (e) {
    logger.debug(`Unable to inspect network ${INTEGRATIONS_NETWORK_NAME}, using default gateway`, e);
  }
  return `http://${gateway}:${serverPort}`;
}

module.exports = {
  getHostApiUrl,
};
