const logger = require('../../../utils/logger');

const FREE_MOBILE_SEND_URL = 'https://smsapi.free-mobile.fr/sendmsg';
const FREE_MOBILE_TIMEOUT = 10 * 1000;

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
    const response = await this.axios.get(FREE_MOBILE_SEND_URL, { params, timeout: FREE_MOBILE_TIMEOUT });
    logger.debug('SMS successfully sent:', response.data);
  } catch (e) {
    // Don't log the raw error: the Axios config contains the Free Mobile access token
    const status = e.response ? e.response.status : null;
    logger.error(`Error sending SMS: ${e.message}${status ? ` (HTTP ${status})` : ''}`);
    throw e;
  }
}

module.exports = {
  send,
};
