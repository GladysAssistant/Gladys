const { USER_ROLE } = require('../../utils/constants');

/**
 * @description Send a message to all admin users.
 * @param {string} messageKey - The message key to translate.
 * @param {object} params - Parameters to pass to the message translation.
 * @returns {Promise<Array>} Array of promises for all sent messages.
 * @example
 * sendToAdmins('message.key', { param1: 'value1' });
 */
async function sendToAdmins(messageKey, params) {
  const admins = await this.user.getByRole(USER_ROLE.ADMIN);
  const promises = [];

  admins.forEach((admin) => {
    const message = this.brain.getReply(admin.language, messageKey, params);
    promises.push(this.sendToUser(admin.selector, message));
  });

  return Promise.all(promises);
}

module.exports = {
  sendToAdmins,
};
