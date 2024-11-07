const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const db = require('../../models');

/**
 * @description Reply to a question from the user.
 * @param {object} originalMessage - The message sent by the user.
 * @param {string} text - The answer to send.
 * @param {object} context - Contain the context, and sometimes additionnal data.
 * @param {string} [file] - An optional file sent with the message.
 * @example
 * reply(originalMessage, 'thanks!');
 */
async function reply(originalMessage, text, context, file = null) {
  try {
    // first, we insert the message in database
    const messageToInsert = {
      text,
      file,
      sender_id: null, // message sent by gladys
      receiver_id: originalMessage.user.id,
    };
    const messageCreated = (await db.Message.create(messageToInsert)).get({ plain: true });
    // send the message through websocket
    this.event.emit(EVENTS.WEBSOCKET.SEND, {
      type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.NEW,
      userId: originalMessage.user.id,
      payload: messageCreated,
    });

    // If the source is Gladys AI, then we should answer by all means available
    if (originalMessage.source === 'AI') {
      const user = this.state.get('user', originalMessage.user.selector);
      const telegramService = this.service.getService('telegram');
      // if the service exist and the user had telegram configured
      if (telegramService && user.telegram_user_id) {
        // we forward the message to Telegram
        await telegramService.message.send(user.telegram_user_id, messageCreated);
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
          await nextcloudTalkService.message.send(nextcloudTalkToken, messageCreated);
        }
      }
    } else {
      // then, we get the service sending the original message
      const service = this.service.getService(originalMessage.source);
      // if the service exist, we send the message
      if (service) {
        await service.message.send(originalMessage.source_user_id, messageCreated);
      }
    }
  } catch (e) {
    logger.warn(`Unable to reply to user`);
    logger.warn(e);
  }
}

module.exports = {
  reply,
};
