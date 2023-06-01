const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');
const { generate } = require('../../../utils/password');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');

/**
 * @description Prepares service and starts connection with broker if needed.
 * @returns {Promise} Resolve when init finished.
 * @example
 * await z2m.init();
 */
async function init() {
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

  logger.debug('NodeRed: installing and starting required docker containers...');
  await this.checkForContainerUpdates(configuration);
  await this.installMqttContainer(configuration);
  await this.installZ2mContainer(configuration);

  if (this.isEnabled()) {
    await this.connect(configuration);

    // Schedule reccurent job if not already scheduled
    if (!this.backupScheduledJob) {
      this.backupScheduledJob = this.gladys.scheduler.scheduleJob('0 0 23 * * *', () => this.backup());
    }
  }


  return null;
}

module.exports = {
  init,
};
