const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
/**
 * @public
 * @description Start one service by name
 * @param {string} name - The name of the service.
 * @example
 * service.start('telegram');
 */
async function start(name) {
  try {
    const service = this.stateManager.get('service', name);
    await service.start();
  } catch (e) {
    if (e instanceof ServiceNotConfiguredError) {
      logger.info(`Service ${name} is not configured, so it was not started.`);
    } else {
      logger.warn(`Unable to start service ${name}`);
      logger.warn(e);
    }
  }
}

module.exports = {
  start,
};
