/**
 * @description Send a message to a Gladys user on Nextcloud Talk, resolving
 * the identity itself (generic outbound channel interface: the core no
 * longer knows any channel by name). No-op when the user has not configured
 * Nextcloud Talk.
 * @param {object} user - Gladys user.
 * @param {object} message - Message object to send.
 * @returns {Promise} Resolve when the message is sent.
 * @example
 * sendToUser(user, { text: 'Hello from Gladys!' });
 */
async function sendToUser(user, message) {
  const token = await this.gladys.variable.getValue('NEXTCLOUD_TALK_TOKEN', this.serviceId, user.id);
  if (!token) {
    return;
  }
  await this.send(token, message);
}

module.exports = {
  sendToUser,
};
