const get = require('get-value');
const logger = require('../../utils/logger');
const { NETWORK_MODE_HOST_PROCESS } = require('../system/system.getNetworkMode');
const { INTEGRATIONS_NETWORK_NAME, INTEGRATIONS_NETWORK_GATEWAY } = require('./constants');

/**
 * @description Compute the base URL of the host API as seen from an
 * integration container. Gladys in host network mode (standard install):
 * the bridge gateway is the host, and the subnet being pinned by IPAM the
 * gateway is deterministic (`172.30.0.1`); if the subnet was already taken,
 * the effective gateway is read with inspectNetwork. Gladys in bridge mode:
 * integrations reach Gladys through the embedded DNS of the custom bridge
 * (`gladys` alias, see ensureNetwork). Gladys as a plain host process
 * (host-process mode, e.g. `npm start` on a Mac with Docker): integrations
 * reach the host through `host.docker.internal` (mapped to the host gateway
 * on the container, see buildContainerDescriptor).
 * @returns {Promise<string>} Resolve with the base URL, without trailing slash.
 * @example
 * const hostApiUrl = await gladys.externalIntegration.getHostApiUrl();
 */
async function getHostApiUrl() {
  // same resolution as server/index.js so the URL always targets the port
  // the server actually listens on (1443 by default, e.g. `npm start` dev)
  const serverPort = parseInt(process.env.SERVER_PORT, 10) || 1443;
  const networkMode = await this.system.getNetworkMode();
  if (networkMode === NETWORK_MODE_HOST_PROCESS) {
    return `http://host.docker.internal:${serverPort}`;
  }
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
