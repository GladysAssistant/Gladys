const logger = require('../../utils/logger');
const { NETWORK_MODE_HOST_PROCESS } = require('./system.getNetworkMode');

const NETWORK_MODE_HOST = 'host';

/**
 * @description Tell if Gladys sits directly on the local network, and not behind a Docker bridge.
 * @returns {Promise<boolean>} Resolve with true when Gladys shares the network of its host.
 * @example
 * const onHostNetwork = await gladys.system.isOnHostNetwork();
 */
async function isOnHostNetwork() {
  try {
    const networkMode = await this.getNetworkMode();
    return networkMode === NETWORK_MODE_HOST || networkMode === NETWORK_MODE_HOST_PROCESS;
  } catch (e) {
    // Gladys is not running in Docker at all (npm start on a host, tests):
    // the process is directly on the network of the machine
    logger.debug(e);
    return true;
  }
}

module.exports = {
  isOnHostNetwork,
  NETWORK_MODE_HOST,
};
