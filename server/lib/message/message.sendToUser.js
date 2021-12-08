const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError } = require('../../utils/coreErrors');
const db = require('../../models');

/**
 * @description Send a message to a user.
 * @param {string} userSelector - The selector of the user.
 * @param {string} text - The answer to send.
 * @param {string} [file] - An optional file sent with the message.
 * @example
 * reply(originalMessage, 'thanks!');
 */
async function sendToUser(userSelector, text, file = null) {
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
  };
  const messageCreated = (await db.Message.create(messageToInsert)).get({ plain: true });
  // send the message through websocket
  this.event.emit(EVENTS.WEBSOCKET.SEND, {
    type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.NEW,
    userId: user.id,
    payload: messageCreated,
  });
  // We send the message to the telegram service
  const telgramService = this.service.getService('telegram');
  // if the service exist and the user had telegram configured
  if (telgramService && user.telegram_user_id) {
    // we forward the message to Telegram
    await telgramService.message.send(user.telegram_user_id, messageCreated);
  }
  // We send the message to the nextcloud talk service
  const nextcloudTalkService = this.service.getService('nextcloud-talk');
  // if the service exist
  if (nextcloudTalkService) {
    const nextcloudTalkToken = this.variable.getValue('NEXTCLOUD_TALK_TOKEN', nextcloudTalkService.id, user.id);
    // if the user had nextcloud talk configured
    if (nextcloudTalkToken) {
      // we forward the message to Nextcloud Talk
      await nextcloudTalkService.message.send(nextcloudTalkToken, messageCreated);
    }
  }
  return messageCreated;
}

module.exports = {
  sendToUser,
};
