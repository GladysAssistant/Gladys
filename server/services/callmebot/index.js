const logger = require('../../utils/logger');
const MessageHandler = require('./lib');

module.exports = function CallMeBotService(gladys, serviceId) {
  const messageHandler = new MessageHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the CallMeBot service.
   * @example
   * gladys.services.callmebot.start();
   */
  async function start() {
    logger.info('Starting CallMeBot service');
  }

  /**
   * @public
   * @description This function stops the CallMeBot service.
   * @example
   * gladys.services.callmebot.stop();
   */
  async function stop() {
    logger.info('Stopping CallMeBot service');
  }

  /**
   * @public
   * @description This function returns if the CallMeBot service is used.
   * @returns {Promise<boolean>} Returns true if the CallMeBot service is used.
   * @example
   * const used = await gladys.services.callmebot.isUsed();
   */
  async function isUsed() {
    const apiKeys = await gladys.variable.getVariables('CALLMEBOT_API_KEY', serviceId);
    return apiKeys.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    message: messageHandler,
    isUsed,
  });
};
