const { Op } = require('sequelize');

const db = require('../../models');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { mcpToolsToChatApiFormat } = require('../../services/mcp/lib/mcpToolsToChatApiFormat');
const { buildSystemPromptWithCurrentTime } = require('./gateway.forwardMessageToAiChat');

const DEFAULT_TIMEZONE = 'Europe/Paris';
const DEBUG_MESSAGE_LIMIT = 50;

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
 * @public
 * @description Build the AI chat request payload for debug/replay purposes.
 * Includes the system prompt, the last 50 conversation messages, and available MCP tools.
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
    attributes: ['sender_id', 'text', 'file', 'message_type', 'created_at'],
    order: [['created_at', 'desc']],
    limit: DEBUG_MESSAGE_LIMIT,
  });

  const messagesForApi = [{ role: 'system', content: buildSystemPromptWithCurrentTime(timezoneName) }];
  recentMessages
    .reverse()
    .forEach((message) => messagesForApi.push(dbMessageToApiMessage(message.get({ plain: true }), userId)));

  return {
    messages: messagesForApi,
    tools: toolsForApi,
    tool_choice: 'auto',
    _debug: {
      generatedAt: new Date().toISOString(),
      userId,
      timezone: timezoneName,
      messageCount: recentMessages.length,
      note: 'Replay this payload via POST /api/v1/gateway/aichat/chat (remove the _debug field first).',
    },
  };
}

module.exports = {
  getAiChatDebugContext,
  dbMessageToApiMessage,
  formatFileAsImageUrl,
};
