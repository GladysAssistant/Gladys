const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const MessageHandler = require('./lib');
const TelegramControllers = require('./api/telegram.controller');

module.exports = function TelegramService(gladys, serviceId) {
  // See https://github.com/yagop/node-telegram-bot-api/issues/540
  process.env.NTBA_FIX_319 = '1';
  process.env.NTBA_FIX_350 = '1';
  const TelegramBot = require('node-telegram-bot-api');
  const messageHandler = new MessageHandler(gladys, TelegramBot, serviceId);
  /**
   * @public
   * @description This function starts the TelegramService.
   * @example
   * gladys.services.telegram.start();
   */
  async function start() {
    logger.info('Starting Telegram service');
    const token = await gladys.variable.getValue('TELEGRAM_API_KEY', serviceId);
    if (!token) {
      throw new ServiceNotConfiguredError('No telegram api token found. Not starting telegram service');
    }
    await messageHandler.connect(token);
  }

  /**
   * @public
   * @description This function stops the TelegramService.
   * @example
   * gladys.services.telegram.stop();
   */
  async function stop() {
    logger.info('stopping Telegram service');
    await messageHandler.disconnect();
  }

  /**
   * @public
   * @description This function returns if the Telegram service is used.
   * @returns {Promise<boolean>} Returns true if a Telegram API token is configured.
   * @example
   * const used = await gladys.services.telegram.isUsed();
   */
  async function isUsed() {
    const token = await gladys.variable.getValue('TELEGRAM_API_KEY', serviceId);
    return Boolean(token);
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    message: messageHandler,
    controllers: TelegramControllers(messageHandler),
  });
};
