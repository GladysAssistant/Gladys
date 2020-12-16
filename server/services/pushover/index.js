const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const MessageHandler = require('./lib');

module.exports = function PushoverService(gladys, serviceId) {
  const messageHandler = new MessageHandler(gladys, serviceId);
  /**
   * @public
   * @description This function starts the Pushover Service
   * @example
   * gladys.services.pushover.start();
   */
  async function start() {
    logger.info('Starting pushover service');
    const token = await gladys.variable.getValue('PUSHOVER_API_KEY', serviceId);
	const user = await gladys.variable.getValue('PUSHOVER_USER_KEY', serviceId);
    if (!token || !user) {
      throw new ServiceNotConfiguredError('No Pushover api token found. Not starting Pushover service');
    }
	await messageHandler.setup(token, user);
  }

  /**
   * @public
   * @description This function stops the Pushover Service
   * @example
   * gladys.services.pushover.stop();
   */
  async function stop() {
    logger.log('stopping pushover service');
  }
 
  return Object.freeze({
    start,
    stop,
    message: messageHandler
  });
};
