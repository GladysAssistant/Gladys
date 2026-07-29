/**
 * @description Send a message to a Gladys user on Telegram, resolving the
 * identity itself (generic outbound channel interface: the core no longer
 * knows any channel by name). No-op when the user has not linked Telegram.
 * @param {object} user - Gladys user (with telegram_user_id).
 * @param {object} message - Message object to send.
 * @returns {Promise} Resolve when the message is sent.
 * @example
 * sendToUser(user, { text: 'Hello from Gladys!' });
 */
async function sendToUser(user, message) {
  if (!user.telegram_user_id) {
    return;
  }
  await this.send(user.telegram_user_id, message);
}

module.exports = {
  sendToUser,
};
