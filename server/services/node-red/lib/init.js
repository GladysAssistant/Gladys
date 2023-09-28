const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');
const { generate } = require('../../../utils/password');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');

/**
 * @description Prepares service and starts connection with broker if needed.
 * @returns {Promise} Resolve when init finished.
 * @example
 * await nodeRed.init();
 */
async function init() {
  if (!(await this.isEnabled())) {
    logger.info('Nodered: is not enabled, skipping...');
    return;
  }

  const dockerBased = await this.gladys.system.isDocker();
  if (!dockerBased) {
    this.dockerBased = false;
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const networkMode = await this.gladys.system.getNetworkMode();
  if (networkMode !== 'host') {
    this.networkModeValid = false;
    throw new PlatformNotCompatible('DOCKER_BAD_NETWORK');
  }

  // Load stored configuration
  const configuration = await this.getConfiguration();

  if (!configuration.nodeRedPassword) {
    configuration.nodeRedUsername = CONFIGURATION.NODE_RED_USERNAME_VALUE;
    configuration.nodeRedPassword = generate(20, {
      number: true,
      lowercase: true,
      uppercase: true,
    });
  }
  await this.saveConfiguration(configuration);

  logger.debug('Node-RED: installing and starting required docker containers...');
  await this.checkForContainerUpdates(configuration);
  await this.installContainer(configuration);
}

module.exports = {
  init,
};
