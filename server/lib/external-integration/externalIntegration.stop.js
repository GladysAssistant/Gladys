const logger = require('../../utils/logger');
const { PlatformNotCompatible } = require('../../utils/coreErrors');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * @description Stop an external integration (user action): stop the
 * container, close the WebSocket connection and set the STOPPED status —
 * which makes the standard lifecycle ignore the integration at boot.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<object>} Resolve with the integration.
 * @example
 * await gladys.externalIntegration.stop('ext-dev-my-integration');
 */
async function stop(selector) {
  const service = await this.getBySelector(selector);
  this.clearTimers(service.id);
  const connection = this.connections.get(service.id);
  if (connection) {
    try {
      connection.terminate();
    } catch (e) {
      logger.debug(e);
    }
    this.connections.delete(service.id);
  }
  if (service.container_id) {
    try {
      await this.system.stopContainer(service.container_id);
    } catch (e) {
      if (e instanceof PlatformNotCompatible) {
        logger.info(`Docker not available, unable to stop container of integration ${selector}`);
      } else {
        logger.warn(`Unable to stop container of integration ${selector}`, e);
      }
    }
  }
  await this.saveStatus(service, SERVICE_STATUS.STOPPED);
  return this.getBySelector(selector);
}

module.exports = {
  stop,
};
