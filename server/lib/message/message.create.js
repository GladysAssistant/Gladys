const logger = require('../../utils/logger');
const db = require('../../models');

/**
 * @public
 * @description handle a new message sent by a user to Gladys.
 * @param {Object} message - A message sent by a user.
 * @param {string} message.text - The text of the message.
 * @param {string} message.language - The language of the message.
 * @param {string} message.source - The name of the service where the message comes from.
 * @param {string} message.source_user_id - The user id for the source service.
 * @param {Object} message.user - A user object.
 * @example
 * message.create(message);
 */
async function create(message) {
  // first, we classify the message to understand the intent
  const { classification, context } = await this.brain.classify(message.text, message.language, {
    user: message.user,
  });

  logger.debug(`Classified "${message.text}" with intent = "${classification.intent}".`);
  logger.debug(classification);

  // if Gladys doesn't understand
  if (classification.intent === 'None') {
    this.replyByIntent(message, 'question.no-intent-found', context);
  }

  const messageToInsert = {
    text: message.text,
    sender_id: message.user.id,
    receiver_id: null,
    is_read: true,
  };

  await db.Message.create(messageToInsert);

  // if a first answer needs to be sent, send it
  if (classification.answer) {
    await this.reply(message, classification.answer, classification.context);
  }

  // new classification found, emitting event
  this.event.emit(`intent.${classification.intent}`, message, classification, context);

  return {
    message,
    classification,
  };
}

module.exports = {
  create,
};
