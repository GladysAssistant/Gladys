const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError } = require('../../utils/coreErrors');
const db = require('../../models');

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
  // forward to every outbound channel of the user: every service exposing
  // message.sendToUser resolves its own identity and no-ops when the user
  // is not linked — the core does not know any channel by name
  await this.forwardToChannels(user, messageCreated);
  return messageCreated;
}

module.exports = {
  sendToUser,
};
