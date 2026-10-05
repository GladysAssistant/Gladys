const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Send a system message (Gladys upgrade, backup failure, low
 * batteries, Gladys Plus subscription, weekly digest…) to a user, through the
 * channel chosen by the admin in the system settings. The setting carries the
 * same three cases as the `service` option of sendToUser: empty or absent →
 * every channel (the historical behaviour), a service name → that channel
 * only, MESSAGE_GLADYS_ONLY_SERVICE → the Gladys conversation only.
 * @param {string} userSelector - The selector of the user.
 * @param {string} text - The message to send.
 * @param {string} [file] - An optional file sent with the message.
 * @param {object} [options] - Extra message options, see sendToUser.
 * @returns {Promise} Resolve with created message.
 * @example
 * sendSystemMessage('tony', 'Gladys was upgraded', null, { messageType: 'notification' });
 */
async function sendSystemMessage(userSelector, text, file = null, options = {}) {
  const service = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.SYSTEM_MESSAGE_SERVICE);
  // going back to "every channel" saves an empty string: a variable value
  // cannot be null in database
  return this.sendToUser(userSelector, text, file, { ...options, service: service || null });
}

module.exports = {
  sendSystemMessage,
};
