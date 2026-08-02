const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { AI_CHAT_TIMEOUT_MS } = require('./constants');

/**
 * @description Relay an OpenAI-compatible chat completion request to an AI
 * provider integration (manifest type "ai") over WebSocket, and return the
 * OpenAI-compatible completion it acks back. The whole agentic loop (MCP
 * tool calling, prompts, history) stays in the core: the integration is a
 * thin adapter to whatever provider it wants. Reasoning models are slow and
 * one request can carry a full tool-calling context, hence the dedicated
 * 120s ack deadline (see constants).
 * @param {object} service - The external integration service.
 * @param {object} request - OpenAI-compatible chat completion request body.
 * @returns {Promise<object>} Resolve with the OpenAI-compatible completion.
 * @example
 * const completion = await gladys.externalIntegration.aiChat(service, { messages: [] });
 */
async function aiChat(service, request) {
  const result = await this.sendCommand(
    service,
    WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.AI_CHAT,
    { request },
    { timeoutMs: AI_CHAT_TIMEOUT_MS },
  );
  const completion = result && result.data;
  if (completion === null || typeof completion !== 'object' || Array.isArray(completion)) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_AI_RESPONSE');
  }
  return completion;
}

module.exports = {
  aiChat,
};
