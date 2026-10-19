const get = require('get-value');
const logger = require('../../utils/logger');
const { Error400, Error403, Error429 } = require('../../utils/httpErrors');
const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
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

const MAX_LOGGED_GATEWAY_ERROR_MESSAGE_LENGTH = 500;

/**
 * @description Describe an AI chat request error for the logs. A request error carries the
 * whole HTTP request (authorization header with the Gladys Plus instance token, body with the
 * user messages and the home description): only its message, its status and the error code and
 * message of the gateway response are kept.
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
  const errorCode = get(e, 'response.data.error_code');
  const errorMessage = get(e, 'response.data.error_message');
  const details = [`status=${status}`];
  if (errorCode !== undefined) {
    details.push(`error_code=${errorCode}`);
  }
  if (errorMessage !== undefined) {
    details.push(`error_message=${String(errorMessage).slice(0, MAX_LOGGED_GATEWAY_ERROR_MESSAGE_LENGTH)}`);
  }
  return `${e.message} (${details.join(', ')})`;
}

/**
 * @public
 * @description Ask the configured AI provider. All the AI traffic funnels
 * here (chat tool-calling loop, intent router, scene ai.ask, weekly digest):
 * when the administrator selected an external AI provider integration
 * (AI_PROVIDER system variable, docs/specs/external-integrations/
 * capabilities/ai-type.md), the OpenAI-compatible request is relayed to it
 * over WebSocket; otherwise it goes to the Gladys Plus gateway (the
 * default). No silent fallback in either direction: a broken provider fails
 * the request — choosing a provider can be a privacy decision,
 * conversations are never rerouted to a provider the user did not pick.
 * The external branch comes before the Gladys Plus plan gate on purpose: an
 * instance whose Plus subscription is paused keeps its own provider.
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
      // same family as a stopped or disconnected provider: the chat loop
      // answers with the dedicated "provider unavailable" reply
      logger.warn(`aiChat: selected AI provider ${aiProviderSelector} is not available`);
      throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_AI_PROVIDER_NOT_AVAILABLE');
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
