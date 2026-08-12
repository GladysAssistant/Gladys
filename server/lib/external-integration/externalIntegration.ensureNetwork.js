const logger = require('../../utils/logger');
const { NETWORK_MODE_HOST_PROCESS } = require('../system/system.getNetworkMode');
const { INTEGRATIONS_NETWORK_NAME, INTEGRATIONS_NETWORK_SUBNET, INTEGRATIONS_NETWORK_GATEWAY } = require('./constants');

/**
 * @description Make sure the dedicated `gladys-integrations` bridge network
 * exists (idempotent, created "hot", no Docker restart needed). When Gladys
 * itself runs in bridge mode (non standard installs), also attach the Gladys
 * container to the network with the `gladys` DNS alias. When Gladys runs as a
 * plain host process (host-process mode), there is no Gladys container to
 * attach: integrations reach the host through `host.docker.internal`.
 * @returns {Promise} Resolve when the network is ready.
 * @example
 * await gladys.externalIntegration.ensureNetwork();
 */
async function ensureNetwork() {
  await this.system.createNetwork(INTEGRATIONS_NETWORK_NAME, {
    Options: {
      // isolate integrations from each other; container -> gateway (Gladys)
      // and container -> internet still work
      'com.docker.network.bridge.enable_icc': 'false',
    },
    IPAM: {
      Driver: 'default',
      Config: [
        {
          Subnet: INTEGRATIONS_NETWORK_SUBNET,
          Gateway: INTEGRATIONS_NETWORK_GATEWAY,
        },
      ],
    },
  });
  const networkMode = await this.system.getNetworkMode();
  if (networkMode !== 'host' && networkMode !== NETWORK_MODE_HOST_PROCESS) {
    try {
      const gladysContainerId = await this.system.getGladysContainerId();
      await this.system.connectToNetwork(INTEGRATIONS_NETWORK_NAME, gladysContainerId, ['gladys']);
    } catch (e) {
      logger.warn(`Unable to attach the Gladys container to the ${INTEGRATIONS_NETWORK_NAME} network`, e);
    }
  }
}

module.exports = {
  ensureNetwork,
};
