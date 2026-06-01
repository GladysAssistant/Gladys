const get = require('get-value');
const logger = require('../../utils/logger');
const { Error403, Error429 } = require('../../utils/httpErrors');

/**
 * @description Get TTS token from Gateway.
 * @param {object} body - The query to ask.
 * @returns {Promise} Resolve with TTS token response.
 * @example
 * getTTSApiUrl({
 *   text: 'Hello world',
 * })
 */
async function getTTSApiUrl(body) {
  try {
    const response = await this.gladysGatewayClient.ttsGetToken(body);
    return response;
  } catch (e) {
    logger.warn(e);
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
  getTTSApiUrl,
};
