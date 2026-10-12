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
 * @description Describe an AI chat request error for the logs. A request error carries the
 * whole HTTP request (authorization header with the Gladys Plus instance token, body with the
 * user messages and the home description): only its message and the gateway response are kept.
 * @param {Error} e - Error thrown while asking the AI.
 * @returns {string} Description of the error, safe to log.
 * @example
 * describeAiChatError(new Error('Request failed with status code 502'));
 */
function describeAiChatError(e) {
  const status = get(e, 'response.status');
  if (status === undefined) {
    return (e && (e.stack || e.message)) || String(e);
  }
  return `${e.message} (status=${status}, response=${JSON.stringify(get(e, 'response.data'))})`;
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
    const response = await this.callPlanGatedApi(() => this.gladysGatewayClient.openAIAsk(requestBody));
    return response;
  } catch (e) {
    logger.debug(`[AI_CHAT] Gateway request failed: ${describeAiChatError(e)}`);
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
  describeAiChatError,
};
