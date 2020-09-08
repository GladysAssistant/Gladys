const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const MessageHandler = require('./lib');
const SlackControllers = require('./api/slack.controller');

module.exports = function SlackService(gladys, serviceId) {
  const { RTMClient } = require('@slack/rtm-api');
  const messageHandler = new MessageHandler(gladys, RTMClient, serviceId);
  /**
   * @public
   * @description This function starts the SlackService
   * @example
   * gladys.services.slack.start();
   */
  async function start() {
    logger.info('Starting slack service');
    const token = await gladys.variable.getValue('SLACK_API_KEY', serviceId);
    if (!token) {
      throw new ServiceNotConfiguredError('No slack api token found. Not starting slack service');
    }
    await messageHandler.connect(token);
  }

  /**
   * @public
   * @description This function stops the TelegramService
   * @example
   * gladys.services.telegram.stop();
   */
  async function stop() {
    logger.log('stopping slack service');
    await messageHandler.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    message: messageHandler,
    controllers: SlackControllers(messageHandler),
  });
};
