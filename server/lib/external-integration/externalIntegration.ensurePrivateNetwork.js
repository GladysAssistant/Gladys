const { PRIVATE_NETWORK_PREFIX, EXTERNAL_INTEGRATION_LABEL } = require('./constants');

/**
 * @description Create the private bridge network of a multi-container
 * integration (idempotent). icc stays enabled inside — the main container
 * must reach its sub-containers (e.g. Frigate -> Mosquitto) — and the
 * network carries the reconciliation label so uninstall and boot
 * reconciliation remove it with the same filter as the containers.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<string>} Resolve with the network name.
 * @example
 * await gladys.externalIntegration.ensurePrivateNetwork(service);
 */
async function ensurePrivateNetwork(service) {
  const networkName = `${PRIVATE_NETWORK_PREFIX}${service.selector}`;
  await this.system.createNetwork(networkName, {
    Labels: { [EXTERNAL_INTEGRATION_LABEL]: service.selector },
  });
  return networkName;
}

module.exports = {
  ensurePrivateNetwork,
};
