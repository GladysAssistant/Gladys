/**
 * @description Send a message to a Gladys user through CallMeBot (generic
 * outbound channel interface: the core no longer knows any channel by
 * name). The per-user configuration is resolved by send itself, which
 * no-ops when the user has not configured CallMeBot.
 * @param {object} user - Gladys user.
 * @param {object} message - Message object to send.
 * @returns {Promise} Resolve when the message is sent.
 * @example
 * sendToUser(user, { text: 'Hello from Gladys!' });
 */
async function sendToUser(user, message) {
  await this.send(user.id, message);
}

module.exports = {
  sendToUser,
};
