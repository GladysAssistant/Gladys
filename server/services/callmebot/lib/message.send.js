const logger = require('../../../utils/logger');

/**
 * @description Send a message through CallMeBot.
 * @param {string} userId - The ID of the user sending the message.
 * @param {object} message - Message object to send.
 * @example
 * send('36816181-8f2a-4e36-8418-cf67b6164fbc', {
 *   text: 'Hello from Gladys!'
 * });
 */
async function send(userId, message) {
  logger.debug(`Sending CallMeBot message for user ${userId}`);

  // Get user-specific configuration
  const apiKey = await this.gladys.variable.getValue('CALLMEBOT_API_KEY', this.serviceId, userId);
  const messagingService = await this.gladys.variable.getValue('CALLMEBOT_MESSAGING_SERVICE', this.serviceId, userId);
  const phoneNumber = await this.gladys.variable.getValue('CALLMEBOT_PHONE_NUMBER', this.serviceId, userId);

  if (!apiKey || !messagingService || !phoneNumber) {
    logger.debug('CallMeBot configuration not found for this user');
    return;
  }

  try {
    const encodedMessage = encodeURIComponent(message.text);
    let url;

    // Build URL based on messaging service
    switch (messagingService.toLowerCase()) {
      case 'whatsapp':
        url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodedMessage}&apikey=${apiKey}`;
        break;
      case 'signal':
        url = `https://api.callmebot.com/signal/send.php?phone=${phoneNumber}&text=${encodedMessage}&apikey=${apiKey}`;
        break;
      default:
        throw new Error(`Unsupported messaging service: ${messagingService}`);
    }

    const response = await this.gladys.http.request('get', url);

    if (!response.data.toLowerCase().includes('message queued')) {
      throw new Error(`Failed to send message: ${response.data}`);
    }

    logger.debug('CallMeBot message sent successfully');
  } catch (e) {
    logger.error('Error while sending CallMeBot message:', e);
    throw e;
  }
}

module.exports = {
  send,
};
