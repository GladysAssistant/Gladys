const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError } = require('../../utils/coreErrors');
const db = require('../../models');

/**
 * @description Send a message to a user.
 * @param {string} userSelector - The selector of the user.
 * @param {string} serviceSelector - The selector of the service.
 * @param {string} text - The answer to send.
 * @param {string} [file] - An optional file sent with the message.
 * @example
 * reply(originalMessage, 'thanks!');
 */
async function sendToUser(userSelector, serviceSelector, text, file = null) {
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

  const service = this.service.getService(serviceSelector);
  if (service) {
    if (serviceSelector === 'telegram') {
      // We send the message to the telegram service
      if (user.telegram_user_id) {
        await service.message.send(user.telegram_user_id, messageCreated);
      }
    } else if (serviceSelector === 'pushover') {
      // We send the message to the pushover service
      if (user && text) {
        await service.message.send(user, text);
      }
    }
  }
  return messageCreated;
}

module.exports = {
  sendToUser,
};
