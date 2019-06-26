const logger = require('../../utils/logger');

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
    logger.warn(`Unable to start service ${name}`);
    logger.warn(e);
  }
}

module.exports = {
  start,
};
