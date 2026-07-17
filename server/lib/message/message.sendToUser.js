const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const db = require('../../models');

/**
 * @description Forward a message to an external service without blocking other channels on failure.
 * @param {string} serviceName - Name of the messaging service for logging.
 * @param {Function} sendFn - Async function that sends the message.
 * @returns {Promise} Resolve when send succeeds or fails (errors are logged).
 * @example
 * await forwardToService('telegram', () => telegramService.message.send(userId, message));
 */
async function forwardToService(serviceName, sendFn) {
  try {
    await sendFn();
  } catch (e) {
    logger.error(`Error while forwarding message to ${serviceName}:`, e);
  }
}

/**
 * @description Send a message to a user.
 * @param {string} userSelector - The selector of the user.
 * @param {string} text - The answer to send.
 * @param {string} [file] - An optional file sent with the message.
 * @param {object} [options] - Extra message options.
 * @param {string} [options.messageType='chat'] - Message display type.
 * @returns {Promise} Resolve with created message.
 * @example
 * sendToUser('tony', 'Bonjour, voici votre bilan.', null, { messageType: 'notification' });
 */
async function sendToUser(userSelector, text, file = null, options = {}) {
  const { messageType = 'chat' } = options;
  const user = this.state.get('user', userSelector);
  if (user === null) {
    throw new NotFoundError(`User ${userSelector} not found`);
  }
  // first, we insert the message in database
  const messageToInsert = {
    text,
    file,
    sender_id: null, // message sent by gladys
    receiver_id: user.id,
    message_type: messageType,
  };
  const messageCreated = (await db.Message.create(messageToInsert)).get({ plain: true });
  // send the message through websocket
  this.event.emit(EVENTS.WEBSOCKET.SEND, {
    type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.NEW,
    userId: user.id,
    payload: messageCreated,
  });
  // We send the message to the telegram service
  const telegramService = this.service.getService('telegram');
  // if the service exist and the user had telegram configured
  if (telegramService && user.telegram_user_id) {
    // we forward the message to Telegram
    await forwardToService('telegram', () => telegramService.message.send(user.telegram_user_id, messageCreated));
  }
  // We send the message to the nextcloud talk service
  const nextcloudTalkService = this.service.getService('nextcloud-talk');
  // if the service exist
  if (nextcloudTalkService) {
    const nextcloudTalkToken = await this.variable.getValue(
      'NEXTCLOUD_TALK_TOKEN',
      nextcloudTalkService.message.serviceId,
      user.id,
    );
    // if the user had nextcloud talk configured
    if (nextcloudTalkToken) {
      // we forward the message to Nextcloud Talk
      await forwardToService('nextcloud-talk', () =>
        nextcloudTalkService.message.send(nextcloudTalkToken, messageCreated),
      );
    }
  }
  // We send the message to the callmebot service
  const callmebotService = this.service.getService('callmebot');
  // if the service exist
  if (callmebotService) {
    // we forward the message to CallMeBot
    await forwardToService('callmebot', () => callmebotService.message.send(user.id, messageCreated));
  }
  return messageCreated;
}

module.exports = {
  sendToUser,
  forwardToService,
};
