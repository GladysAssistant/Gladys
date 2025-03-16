const logger = require('../../utils/logger');
const MessageHandler = require('./lib');

module.exports = function CallMeBotService(gladys, serviceId) {
  const messageHandler = new MessageHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the CallMeBot service
   * @example
   * gladys.services.callmebot.start();
   */
  async function start() {
    logger.info('Starting CallMeBot service');
  }

  /**
   * @public
   * @description This function stops the CallMeBot service
   * @example
   * gladys.services.callmebot.stop();
   */
  async function stop() {
    logger.info('Stopping CallMeBot service');
  }

  return Object.freeze({
    start,
    stop,
    message: messageHandler,
  });
};
