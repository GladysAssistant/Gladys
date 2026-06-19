const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const db = require('../../models');

const TOOL_CALL_EXTERNAL_SOURCES = new Set(['telegram', 'nextcloud-talk', 'callmebot']);

/**
 * @description Whether a tool_call trace should be forwarded to external channels.
 * Web/API clients already receive tool traces through websocket.
 * @param {string} source - Original message source.
 * @param {string} messageType - Message type.
 * @returns {boolean} True when the message should be forwarded externally.
 * @example
 * shouldForwardToolCallToExternalChannel('telegram', 'tool_call');
 */
function shouldForwardToolCallToExternalChannel(source, messageType) {
  if (messageType !== 'tool_call') {
    return true;
  }
  return TOOL_CALL_EXTERNAL_SOURCES.has(source);
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

    // Tool call traces stay in Gladys chat for web/API clients (websocket only).
    if (!shouldForwardToolCallToExternalChannel(originalMessage.source, messageType)) {
      return;
    }

    const externalMessage = formatMessageForExternalChannel(messageCreated);

    // If the source is Gladys AI, then we should answer by all means available
    if (originalMessage.source === 'AI') {
      const user = this.state.get('user', originalMessage.user.selector);
      const telegramService = this.service.getService('telegram');
      // if the service exist and the user had telegram configured
      if (telegramService && user.telegram_user_id) {
        // we forward the message to Telegram
        await telegramService.message.send(user.telegram_user_id, externalMessage);
      }
      // We send the message to the nextcloud talk service
      const nextcloudTalkService = this.service.getService('nextcloud-talk');
      // if the service exist
      if (nextcloudTalkService) {
        const nextcloudTalkToken = await this.variable.getValue(
          'NEXTCLOUD_TALK_TOKEN',
          nextcloudTalkService.message.serviceId,
          user.id,
        );
        // if the user had nextcloud talk configured
        if (nextcloudTalkToken) {
          // we forward the message to Nextcloud Talk
          await nextcloudTalkService.message.send(nextcloudTalkToken, externalMessage);
        }
      }
      // We send the message to the callmebot service
      const callmebotService = this.service.getService('callmebot');
      // if the service exist
      if (callmebotService) {
        // we forward the message to CallMeBot
        await callmebotService.message.send(user.id, externalMessage);
      }
    } else {
      // then, we get the service sending the original message
      const service = this.service.getService(originalMessage.source);
      // if the service exist, we send the message
      if (service) {
        await service.message.send(originalMessage.source_user_id, externalMessage);
      }
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
