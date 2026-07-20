const get = require('get-value');
const logger = require('../../utils/logger');
const { Error400, Error403, Error429 } = require('../../utils/httpErrors');
const { resolveAiChatModel } = require('../../utils/aiChatModels');

/**
 * @description Normalize an optional model field before calling the gateway.
 * @param {object} body - OpenAI-compatible chat request body.
 * @returns {object} Request body with a validated model field when provided.
 * @example
 * normalizeAiChatRequestBody({ messages: [], model: 'auto' });
 */
function normalizeAiChatRequestBody(body) {
  const requestBody = { ...body };
  if (!Object.prototype.hasOwnProperty.call(requestBody, 'model')) {
    return requestBody;
  }

  const resolvedModel = resolveAiChatModel(requestBody.model);
  if (requestBody.model && resolvedModel === null) {
    throw new Error400('INVALID_AI_MODEL');
  }
  if (resolvedModel) {
    requestBody.model = resolvedModel;
  } else {
    delete requestBody.model;
  }
  return requestBody;
}

/**
 * @public
 * @description Ask the Gladys Gateway AI endpoint.
 * @param {object} body - OpenAI-compatible chat request body.
 * @returns {Promise<object>} Chat completion-like response.
 * @example
 * aiChat({ messages: [{ role: 'user', content: 'Hello' }] });
 */
async function aiChat(body) {
  const requestBody = normalizeAiChatRequestBody(body);
  try {
    const response = await this.gladysGatewayClient.openAIAsk(requestBody);
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
  normalizeAiChatRequestBody,
};
