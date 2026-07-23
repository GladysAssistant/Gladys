const { Op } = require('sequelize');

const db = require('../../models');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { mcpToolsToChatApiFormat } = require('../../services/mcp/lib/mcpToolsToChatApiFormat');
const {
  buildExchangesFromMessages,
  exchangesToApiMessages,
} = require('../message/message.getPreviousQuestionsForUser');
const { buildSystemPromptWithCurrentTime } = require('./gateway.forwardMessageToAiChat');

const DEFAULT_TIMEZONE = 'Europe/Paris';

// Number of most recent messages to include in the AI chat debug context.
// Larger than the live chat fetch limit so the debug payload shows more history.
const DEBUG_MESSAGE_LIMIT = 200;

/**
 * @description Return MCP handler from service manager.
 * @param {object} serviceManager - Service manager instance.
 * @returns {object} MCP handler.
 * @example
 * getMcpHandler(serviceManager);
 */
function getMcpHandler(serviceManager) {
  const mcpService = serviceManager.getService('mcp');
  if (!mcpService?.mcpHandler) {
    throw new Error('MCP service is not running. Start the MCP integration before using AI chat.');
  }
  return mcpService.mcpHandler;
}

/**
 * @description Format a stored file payload as a data URL for the chat API.
 * @param {string} file - Stored file payload.
 * @returns {string|null} Data URL or null.
 * @example
 * formatFileAsImageUrl('image/jpeg;base64,abc');
 */
function formatFileAsImageUrl(file) {
  if (!file) {
    return null;
  }
  if (file.startsWith('data:')) {
    return file;
  }
  return `data:${file}`;
}

/**
 * @description Convert a stored Gladys message to an OpenAI-compatible chat message.
 * @param {object} message - Stored message row.
 * @param {string} userId - Gladys user id.
 * @returns {object} Chat API message.
 * @example
 * dbMessageToApiMessage({ sender_id: 'user-1', text: 'Hello', file: null }, 'user-1');
 */
function dbMessageToApiMessage(message, userId) {
  const isUser = message.sender_id === userId;
  const role = isUser ? 'user' : 'assistant';
  const imageUrl = formatFileAsImageUrl(message.file);

  if (imageUrl) {
    const content = [];
    if (message.text) {
      content.push({ type: 'text', text: message.text });
    }
    content.push({ type: 'image_url', image_url: { url: imageUrl } });
    return { role, content };
  }

  return { role, content: message.text || '' };
}

/**
 * @description Map a stored Gladys message to a debug timeline role.
 * @param {object} message - Stored message row.
 * @param {string} userId - Gladys user id.
 * @returns {string} Debug timeline role.
 * @example
 * getDebugMessageRole({ sender_id: 'user-1', message_type: 'chat' }, 'user-1');
 */
function getDebugMessageRole(message, userId) {
  if (message.message_type === 'tool_call') {
    return 'tool_call';
  }
  if (message.message_type === 'notification') {
    return 'notification';
  }
  if (message.sender_id === userId) {
    return 'user';
  }
  return 'assistant';
}

/**
 * @description Format a stored message for the debug conversation history.
 * @param {object} message - Stored message row.
 * @param {string} userId - Gladys user id.
 * @returns {object} Debug history entry.
 * @example
 * formatStoredMessageForDebug({ sender_id: 'user-1', text: 'Hi', message_type: 'chat' }, 'user-1');
 */
function formatStoredMessageForDebug(message, userId) {
  const entry = {
    created_at: message.created_at,
    role: getDebugMessageRole(message, userId),
    message_type: message.message_type,
    text: message.text,
  };

  if (message.tool_name) {
    entry.tool_name = message.tool_name;
  }
  if (message.tool_status) {
    entry.tool_status = message.tool_status;
  }
  if (message.file) {
    entry.has_file = true;
  }

  return entry;
}

/**
 * @description Build the full conversation history for debug output.
 * @param {Array<object>} chronologicalMessages - Stored messages, oldest first.
 * @param {string} userId - Gladys user id.
 * @returns {{messages: Array<object>, toolCalls: Array<object>}} Full history and tool calls.
 * @example
 * buildConversationHistoryForDebug([{ sender_id: 'user-1', text: 'Hi', message_type: 'chat' }], 'user-1');
 */
function buildConversationHistoryForDebug(chronologicalMessages, userId) {
  const messages = chronologicalMessages.map((message) => formatStoredMessageForDebug(message, userId));
  const toolCalls = messages.filter((message) => message.role === 'tool_call');

  return { messages, toolCalls };
}

/**
 * @public
 * @description Build the AI chat request payload for debug/replay purposes.
 * The replay payload includes all exchanges rebuilt from the last messages.
 * Full stored history (including tool calls) is exposed under _debug.conversationHistory.
 * @param {string} userId - Gladys user id.
 * @returns {Promise<object>} OpenAI-compatible chat request body.
 * @example
 * getAiChatDebugContext('user-uuid');
 */
async function getAiChatDebugContext(userId) {
  const mcpHandler = getMcpHandler(this.serviceManager);
  const mcpTools = await mcpHandler.getAllTools(userId);
  const toolsForApi = mcpToolsToChatApiFormat(mcpTools);

  const configuredTimezone = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  const timezoneName = configuredTimezone || DEFAULT_TIMEZONE;

  const recentMessages = await db.Message.findAll({
    where: {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    },
    attributes: ['sender_id', 'text', 'file', 'message_type', 'tool_name', 'tool_status', 'created_at'],
    order: [['created_at', 'desc']],
    limit: DEBUG_MESSAGE_LIMIT,
  });

  const plainMessages = recentMessages.map((message) => message.get({ plain: true }));
  const chronologicalMessages = plainMessages.reverse();
  const exchanges = buildExchangesFromMessages(chronologicalMessages);
  const conversationHistory = buildConversationHistoryForDebug(chronologicalMessages, userId);
  const messagesForApi = [
    { role: 'system', content: buildSystemPromptWithCurrentTime(timezoneName) },
    ...exchangesToApiMessages(exchanges),
  ];

  return {
    messages: messagesForApi,
    tools: toolsForApi,
    tool_choice: 'auto',
    _debug: {
      generatedAt: new Date().toISOString(),
      userId,
      timezone: timezoneName,
      messageCount: recentMessages.length,
      exchangeCount: exchanges.length,
      conversationHistory,
      note: 'Replay this payload via POST /api/v1/gateway/aichat/chat (remove the _debug field first).',
    },
  };
}

module.exports = {
  DEBUG_MESSAGE_LIMIT,
  getAiChatDebugContext,
  dbMessageToApiMessage,
  formatFileAsImageUrl,
  getDebugMessageRole,
  formatStoredMessageForDebug,
  buildConversationHistoryForDebug,
};
