const get = require('get-value');
const axios = require('axios');
const logger = require('../../utils/logger');
const { Error400, Error403, Error429 } = require('../../utils/httpErrors');
const { resolveAiChatModel } = require('../../utils/aiChatModels');
const { isOpenJarvisSelected } = require('../../utils/localAiProvider');

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
 * @description Ask the configured AI endpoint.
 * @param {object} body - OpenAI-compatible chat request body.
 * @returns {Promise<object>} Chat completion-like response.
 * @example
 * aiChat({ messages: [{ role: 'user', content: 'Hello' }] });
 */
async function aiChat(body) {
  const localProvider = isOpenJarvisSelected();
  const requestBody = localProvider ? { ...body } : normalizeAiChatRequestBody(body);
  try {
    if (localProvider) {
      const url = (process.env.BOBS_HOME_OPENJARVIS_URL || 'http://127.0.0.1:8788').replace(/\/$/, '');
      const key = process.env.BOBS_HOME_OPENJARVIS_KEY;
      const chatBody = {
        messages: requestBody.messages,
        tools: requestBody.tools,
        tool_choice: requestBody.tool_choice,
        temperature: requestBody.temperature,
        max_tokens: requestBody.max_tokens,
      };
      const response = await axios.post(`${url}/v1/chat/completions`, chatBody, {
        timeout: 120000,
        headers: key ? { Authorization: `Bearer ${key}` } : {},
      });
      return response.data;
    }
    const response = await this.callPlanGatedApi(() => this.gladysGatewayClient.openAIAsk(requestBody));
    return response;
  } catch (e) {
    if (localProvider) {
      // Axios errors contain request headers, including the private bridge key.
      logger.warn(`OpenJarvis bridge request failed: ${e.message}`);
      throw new Error('OpenJarvis bridge request failed');
    }
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
