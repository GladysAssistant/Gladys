const logger = require('../../../../utils/logger');

/**
 * @description Disconnect to OverKiz server.
 * @returns {Promise<object>} Return Object of informations.
 * @example
 * overkiz.disconnect();
 */
async function disconnect() {
  logger.info(`Overkiz : Disonnecting Overkiz...`);

  if (this.updateDevicesJob) {
    this.updateDevicesJob.stop();
  }
}

module.exports = {
  disconnect,
};
