const get = require('get-value');
const logger = require('../../utils/logger');
const { Error400, Error403, Error429 } = require('../../utils/httpErrors');
const { resolveAiChatModel } = require('../../utils/aiChatModels');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

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
 * @description Ask the configured AI provider. All the AI traffic funnels
 * here (chat tool-calling loop, intent router, weekly digest): when the
 * user selected an external AI provider integration (AI_PROVIDER system
 * variable, see the external integrations spec B.18), the OpenAI-compatible
 * request is relayed to it over WebSocket; otherwise it goes to the Gladys
 * Plus gateway (the default). No silent fallback in either direction: a
 * broken provider fails the request — choosing a provider can be a privacy
 * decision, conversations are never rerouted to a provider the user did
 * not pick.
 * @param {object} body - OpenAI-compatible chat request body.
 * @returns {Promise<object>} Chat completion-like response.
 * @example
 * aiChat({ messages: [{ role: 'user', content: 'Hello' }] });
 */
async function aiChat(body) {
  const aiProviderSelector = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER);
  if (aiProviderSelector) {
    const proxyService = this.serviceManager.getService(aiProviderSelector);
    if (!proxyService || !proxyService.ai || typeof proxyService.ai.chat !== 'function') {
      throw new Error400(`AI provider ${aiProviderSelector} is not available`);
    }
    // the model field is Gladys Plus vocabulary (Scaleway model ids),
    // meaningless for an external provider: it picks its model in its own
    // config. The purpose/categories hints pass through (generic).
    const { model, ...requestForProvider } = body;
    if (model) {
      logger.debug(`aiChat: dropping model=${model} before relaying to AI provider ${aiProviderSelector}`);
    }
    return proxyService.ai.chat(requestForProvider);
  }
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
