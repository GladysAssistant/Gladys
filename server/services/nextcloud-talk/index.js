const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const MessageHandler = require('./lib');
// const TelegramControllers = require('./api/telegram.controller');

module.exports = function NextcloudTalkService(gladys, serviceId) {
  const messageHandler = new MessageHandler(gladys, serviceId);
  /**
   * @public
   * @description This function starts the Nextcloud Talk Service
   * @example
   * gladys.services.nextcloudTalk.start();
   */
  async function start() {
    logger.info('Starting Nextcloud Talk service');
    const tokens = await gladys.user.getNextcloudTalkTokens();

    if (!tokens) {
      throw new ServiceNotConfiguredError('No Nextcloud token found. Not starting Nextcloud Talk service');
    }
    await messageHandler.connect(tokens);
  }

  /**
   * @public
   * @description This function stops the Nextcloud Talk Service
   * @example
   * gladys.services.nextcloudTalk.stop();
   */
  async function stop() {
    logger.info('stopping Nextcloud Talk service');
    await messageHandler.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    message: messageHandler,
    // controllers: TelegramControllers(messageHandler),
  });
};
