const logger = require('../../../utils/logger');

const FREE_MOBILE_SEND_URL = 'https://smsapi.free-mobile.fr/sendmsg';

/**
 * @description Send an SMS through Free Mobile for a given user.
 * @param {string} userId - The ID of the user to send the SMS to.
 * @param {object} message - Message object to send.
 * @example
 * send('36816181-8f2a-4e36-8418-cf67b6164fbc', {
 *   text: 'Hello from Gladys!'
 * });
 */
async function send(userId, message) {
  logger.debug(`Sending Free Mobile SMS for user ${userId}`);

  // Get user-specific configuration
  const username = await this.gladys.variable.getValue('FREE_MOBILE_USERNAME', this.serviceId, userId);
  const accessToken = await this.gladys.variable.getValue('FREE_MOBILE_ACCESS_TOKEN', this.serviceId, userId);

  if (!username || !accessToken) {
    logger.debug('Free Mobile configuration not found for this user');
    return;
  }

  const params = {
    user: username,
    pass: accessToken,
    msg: message.text,
  };

  try {
    const response = await this.axios.get(FREE_MOBILE_SEND_URL, { params });
    logger.debug('SMS successfully sent:', response.data);
  } catch (e) {
    logger.error('Error sending SMS:', e);
    throw e;
  }
}

module.exports = {
  send,
};
