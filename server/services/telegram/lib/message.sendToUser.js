const logger = require('../../../utils/logger');

/**
 * @description Send a message to a Gladys user on Telegram, resolving the
 * identity itself (generic outbound channel interface: the core no longer
 * knows any channel by name). No-op when the user has not linked Telegram,
 * and when the service itself is not configured — a user keeping an old
 * telegram_user_id after moving to another channel would otherwise get a
 * "Telegram not configured" stack trace on every single notification.
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
  if (!this.bot) {
    logger.debug('Telegram is not configured, not forwarding the message');
    return;
  }
  await this.send(user.telegram_user_id, message);
}

module.exports = {
  sendToUser,
};
