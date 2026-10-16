const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, AI_CHAT_PURPOSES } = require('../../utils/constants');
const {
  AI_CHAT_TIMEOUT_MS,
  AI_CHAT_INTENT_CLASSIFICATION_TIMEOUT_MS,
  MAX_AI_CHAT_IN_FLIGHT,
  MAX_AI_CHAT_CONTENT_CHARS,
  MAX_AI_CHAT_TOOL_CALLS,
  MAX_AI_CHAT_TOOL_ARGUMENTS_CHARS,
  AI_CHAT_TOOL_NAME_REGEX,
} = require('./constants');

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * @description Bound one OpenAI-compatible tool call of a completion: only
 * the fields the chat loop consumes are kept (id, type, function.name,
 * function.arguments), each bounded. A tool call the loop could not run
 * (missing or malformed name, oversized arguments) is a contract violation
 * and returns null.
 * @param {object} toolCall - The tool call acked by the integration.
 * @returns {object|null} The bounded tool call, or null when malformed.
 * @example
 * normalizeToolCall({ id: 'call_1', type: 'function', function: { name: 'weather_get', arguments: '{}' } });
 */
function normalizeToolCall(toolCall) {
  if (!isObject(toolCall) || !isObject(toolCall.function)) {
    return null;
  }
  const { name } = toolCall.function;
  if (typeof name !== 'string' || !AI_CHAT_TOOL_NAME_REGEX.test(name)) {
    return null;
  }
  const args = toolCall.function.arguments === undefined ? '{}' : toolCall.function.arguments;
  if (typeof args !== 'string' || args.length > MAX_AI_CHAT_TOOL_ARGUMENTS_CHARS) {
    return null;
  }
  const id = typeof toolCall.id === 'string' && toolCall.id.length > 0 ? toolCall.id.slice(0, 128) : null;
  return {
    id,
    type: 'function',
    function: { name, arguments: args },
  };
}

/**
 * @description Bound an OpenAI-compatible completion acked by an AI provider
 * before it enters the chat loop (C.4 of capabilities/ai-type.md: data =
 * completion with an object choices[0].message). The payload comes from
 * unaudited code and its content drives the tool-calling loop with the
 * user's authority: everything but the consumed fields is dropped, content
 * is a bounded string (or null), tool calls are bounded in number and size.
 * @param {any} completion - The acked completion.
 * @returns {object|null} The bounded completion, or null when malformed.
 * @example
 * normalizeAiCompletion({ choices: [{ message: { role: 'assistant', content: 'Hi' } }] });
 */
function normalizeAiCompletion(completion) {
  if (!isObject(completion) || !Array.isArray(completion.choices) || !isObject(completion.choices[0])) {
    return null;
  }
  const { message } = completion.choices[0];
  if (!isObject(message)) {
    return null;
  }
  let content = null;
  if (typeof message.content === 'string') {
    content = message.content.slice(0, MAX_AI_CHAT_CONTENT_CHARS);
  } else if (message.content !== null && message.content !== undefined) {
    return null;
  }
  const normalizedMessage = { role: 'assistant', content };
  if (message.tool_calls !== undefined && message.tool_calls !== null) {
    if (!Array.isArray(message.tool_calls) || message.tool_calls.length > MAX_AI_CHAT_TOOL_CALLS) {
      return null;
    }
    const toolCalls = message.tool_calls.map(normalizeToolCall);
    if (toolCalls.includes(null)) {
      return null;
    }
    if (toolCalls.length > 0) {
      normalizedMessage.tool_calls = toolCalls;
    }
  }
  return { choices: [{ message: normalizedMessage }] };
}

/**
 * @description Relay an OpenAI-compatible chat completion request to an AI
 * provider integration (manifest type "ai") over WebSocket, and return the
 * OpenAI-compatible completion it acks back, bounded. The whole agentic loop
 * (MCP tool calling, prompts, history) stays in the core: the integration is
 * a thin adapter to whatever provider it wants. Reasoning models are slow and
 * one request can carry a full tool-calling context, hence the dedicated
 * 120 s ack deadline (20 s for the intent router, which must fail fast);
 * and a local CPU model cannot absorb a burst, hence the cap on requests in
 * flight per integration (see constants).
 * @param {object} service - The external integration service.
 * @param {object} request - OpenAI-compatible chat completion request body.
 * @returns {Promise<object>} Resolve with the bounded OpenAI-compatible completion.
 * @example
 * const completion = await gladys.externalIntegration.aiChat(service, { messages: [] });
 */
async function aiChat(service, request) {
  const inFlight = this.aiChatInFlight.get(service.id) || 0;
  if (inFlight >= MAX_AI_CHAT_IN_FLIGHT) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_AI_PROVIDER_BUSY');
  }
  this.aiChatInFlight.set(service.id, inFlight + 1);
  const timeoutMs =
    request && request.purpose === AI_CHAT_PURPOSES.INTENT_CLASSIFICATION
      ? AI_CHAT_INTENT_CLASSIFICATION_TIMEOUT_MS
      : AI_CHAT_TIMEOUT_MS;
  let result;
  try {
    result = await this.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.AI_CHAT,
      { request },
      { timeoutMs },
    );
  } finally {
    // the entry may already be gone when a request settles after the
    // integration was uninstalled: never rely on NaN arithmetic there
    const remaining = (this.aiChatInFlight.get(service.id) || 0) - 1;
    if (remaining > 0) {
      this.aiChatInFlight.set(service.id, remaining);
    } else {
      this.aiChatInFlight.delete(service.id);
    }
  }
  // fail malformed completions at the contract boundary instead of letting
  // the chat loop degrade them into a silent empty turn: adapter bugs
  // surface as EXTERNAL_INTEGRATION_INVALID_AI_RESPONSE, much easier to
  // diagnose from the integration side
  const completion = normalizeAiCompletion(result && result.data);
  if (completion === null) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_AI_RESPONSE');
  }
  return completion;
}

module.exports = {
  aiChat,
  normalizeAiCompletion,
};
