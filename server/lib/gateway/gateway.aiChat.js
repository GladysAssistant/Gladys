const get = require('get-value');
const logger = require('../../utils/logger');
const { Error403, Error429 } = require('../../utils/httpErrors');

/**
 * @public
 * @description Ask the Gladys Gateway AI endpoint.
 * @param {object} body
 * @returns {Promise<object>} Chat completion-like response.
 */
async function aiChat(body) {
  try {
    const response = await this.gladysGatewayClient.openAIAsk(body);
    // return await requestApi.post(`${this.gladysGatewayClient.serverUrl}${AI_CHAT_PATH}`, body, this.gladysGatewayClient);
    /* const { data } =  await axios.post('http://0.0.0.0:8787', body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer test`,
      },
    }); */
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
