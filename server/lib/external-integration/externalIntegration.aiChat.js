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
  // fail malformed completions at the contract boundary (C.4: data =
  // OpenAI-compatible completion, choices[0].message) instead of letting
  // the chat loop degrade them into a silent empty turn: adapter bugs
  // surface as EXTERNAL_INTEGRATION_INVALID_AI_RESPONSE, much easier to
  // diagnose from the integration side
  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isObject(completion) || !Array.isArray(completion.choices) || !isObject(completion.choices[0]?.message)) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_AI_RESPONSE');
  }
  return completion;
}

module.exports = {
  aiChat,
};
