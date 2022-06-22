const logger = require('../../../../utils/logger');

/**
 * @description Update ZWave devices configuration.
 * @returns {Promise<boolean>} True if success, false otherwise.
 * @example
 * zwave.updateDeviceConfiguration();
 */
async function updateDeviceConfiguration() {
  logger.info(`Zwave : Updating Configuration...`);
  if (this.ready) {
    const newVersion = await this.driver.checkForConfigUpdates();
    let updated = false;
    if (newVersion) {
      logger.info(`Zwave : Update Configuration: New version ${newVersion} is available`);
      updated = await this.driver.installConfigUpdate();
      if (updated) {
        logger.info(`Zwave : Update Configuration successfull: New version is installed`);
      } else {
        logger.info(`Zwave : Update Configuration failed: version is up-to-date`);
      }
    }
    return updated;
  }
  logger.debug(`Zwave : Update Configuration failed: Driver not ready`);
  return false;
}

module.exports = {
  updateDeviceConfiguration,
};
