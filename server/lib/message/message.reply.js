const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const db = require('../../models');

/**
 * @description Whether a tool_call trace should be forwarded to external channels.
 * Web/API clients already receive tool traces through websocket. An external
 * channel is any service exposing the outbound interface message.sendToUser —
 * telegram & co, and external "communication" integrations — instead of a
 * hard-coded name list.
 * @param {string} source - Original message source.
 * @param {string} messageType - Message type.
 * @param {object|null} sourceService - The service the message came from.
 * @returns {boolean} True when the message should be forwarded externally.
 * @example
 * shouldForwardToolCallToExternalChannel('telegram', 'tool_call', telegramService);
 */
function shouldForwardToolCallToExternalChannel(source, messageType, sourceService) {
  if (messageType !== 'tool_call') {
    return true;
  }
  return Boolean(sourceService && sourceService.message && typeof sourceService.message.sendToUser === 'function');
}

/**
 * @description Format a message payload for external messaging channels.
 * @param {object} message - Stored Gladys message.
 * @returns {object} Message payload to send externally.
 * @example
 * formatMessageForExternalChannel({ message_type: 'tool_call', tool_name: 'scene_create', tool_status: 'success' });
 */
function formatMessageForExternalChannel(message) {
  if (message.message_type !== 'tool_call') {
    return message;
  }
  const prefix = message.tool_status === 'error' ? '❌ ' : '⚙️ ';
  const label = message.tool_name || message.text || 'tool_call';
  return {
    ...message,
    text: `${prefix}${label}`,
  };
}

/**
 * @description Reply to a question from the user.
 * @param {object} originalMessage - The message sent by the user.
 * @param {string} text - The answer to send.
 * @param {object} context - Contain the context, and sometimes additionnal data.
 * @param {string} [file] - An optional file sent with the message.
 * @param {object} [options] - Extra message options.
 * @param {string} [options.messageType='chat'] - Message display type.
 * @param {string} [options.toolName] - Optional tool name for tool_call messages.
 * @param {string} [options.toolStatus] - Optional status ('success' | 'error').
 * @example
 * reply(originalMessage, 'thanks!');
 */
async function reply(originalMessage, text, context, file = null, options = {}) {
  try {
    const { messageType = 'chat', toolName = null, toolStatus = null } = options;
    // first, we insert the message in database
    const messageToInsert = {
      text,
      file,
      sender_id: null, // message sent by gladys
      receiver_id: originalMessage.user.id,
      message_type: messageType,
      tool_name: toolName,
      tool_status: toolStatus,
    };
    const messageCreated = (await db.Message.create(messageToInsert)).get({ plain: true });
    // send the message through websocket
    this.event.emit(EVENTS.WEBSOCKET.SEND, {
      type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.NEW,
      userId: originalMessage.user.id,
      payload: messageCreated,
    });

    // then, we get the service sending the original message
    const sourceService = originalMessage.source === 'AI' ? null : this.service.getService(originalMessage.source);

    // Tool call traces stay in Gladys chat for web/API clients (websocket only).
    if (!shouldForwardToolCallToExternalChannel(originalMessage.source, messageType, sourceService)) {
      return;
    }

    const externalMessage = formatMessageForExternalChannel(messageCreated);

    // If the source is Gladys AI, then we should answer by all means available:
    // every service exposing message.sendToUser resolves its own identity and
    // no-ops when the user is not linked (generic loop, no channel hard-coded)
    if (originalMessage.source === 'AI') {
      const user = this.state.get('user', originalMessage.user.selector);
      await this.forwardToChannels(user, externalMessage);
    } else if (sourceService) {
      // if the service exist, we send the message
      await sourceService.message.send(originalMessage.source_user_id, externalMessage);
    }
  } catch (e) {
    logger.warn(`Unable to reply to user`);
    logger.warn(e);
  }
}

module.exports = {
  reply,
  shouldForwardToolCallToExternalChannel,
  formatMessageForExternalChannel,
};
