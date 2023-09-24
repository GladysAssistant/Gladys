const get = require('get-value');
const logger = require('../../utils/logger');
const { Error403, Error429 } = require('../../utils/httpErrors');

/**
 * @description Ask OpenAI a question.
 * @param {object} body - The query to ask.
 * @returns {Promise} Resolve with OpenAI response.
 * @example
 * openAIAsk({
 *    question
 * })
 */
async function openAIAsk(body) {
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
  openAIAsk,
};
