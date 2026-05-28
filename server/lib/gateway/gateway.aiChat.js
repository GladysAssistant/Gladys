const get = require('get-value');
const logger = require('../../utils/logger');
const { Error403, Error429 } = require('../../utils/httpErrors');

/**
 * @public
 * @description Ask the Gladys Gateway AI endpoint.
 * @param {object} body - OpenAI-compatible chat request body.
 * @returns {Promise<object>} Chat completion-like response.
 * @example
 * aiChat({ messages: [{ role: 'user', content: 'Hello' }] });
 */
async function aiChat(body) {
  try {
    const response = await this.gladysGatewayClient.openAIAsk(body);
    return response;
  } catch (e) {
    logger.debug(e);
    const status = get(e, 'response.status');
    const message = get(e, 'response.data.error_message');
    if (status === 403) {
      throw new Error403(message);
    }
    if (status === 429) {
      throw new Error429(message);
    }
    throw e;
  }
}

module.exports = {
  aiChat,
};
