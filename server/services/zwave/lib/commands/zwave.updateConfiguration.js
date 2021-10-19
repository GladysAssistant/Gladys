const logger = require('../../../../utils/logger');

/**
 * @description Update ZWave configuration.
 * @returns {Promise<boolean>} True if success, false otherwise.
 * @example
 * zwave.updateConfiguration();
 */
async function updateConfiguration() {
  logger.info(`Zwave : Updating Configuration...`);
  if (this.ready) {
    const updated = await this.driver.installConfigUpdate();
    if (updated) {
      logger.info(`Zwave : Update Configuration successfull: New version is installed`);
    } else {
      logger.info(`Zwave : Update Configuration failed: version is up-to-date`);
    }
    return updated;
  }
  logger.debug(`Zwave : Update Configuration failed: Driver not ready`);
  return false;
}

module.exports = {
  updateConfiguration,
};
