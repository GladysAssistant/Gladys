const logger = require('../../../utils/logger');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');

/**
 * @description Prepares service and starts connection with Matterbridge if needed.
 * @returns {Promise} Resolve when init finished.
 * @example
 * await matterbridge.init();
 */
async function init() {
  if (!(await this.isEnabled())) {
    logger.info('Matterbridge: is not enabled, skipping...');
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

  logger.debug('Matterbridge: installing and starting required docker containers...');
  await this.checkForContainerUpdates(configuration);
  await this.installContainer(configuration);

  // Save configuration after checkForContainerUpdates has updated the version
  await this.saveConfiguration(configuration);
}

module.exports = {
  init,
};
