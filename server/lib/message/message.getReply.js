const logger = require('../../utils/logger');
const db = require('../../models');

/**
 * @public
 * @description handle a new message sent by a user to Gladys.
 * @param {Object} message - A message sent by a user.
 * @param {string} message.text - The text of the message.
 * @param {string} message.language - The language of the message.
 * @example
 * message.getReply(message);
 */
async function getReply(message, language) {
  // first, we classify the message to understand the intent
  const { classification, context } = await this.brain.classify(message, language);

  logger.debug(`Classified "${message.text}" with intent = "${classification.intent}".`);
  logger.debug(classification);

  // if Gladys doesn't understand
  if (classification.intent === 'None') {
    return 'What ?'
  } else {
    return classification.answer
  }
}

module.exports = {
  getReply,
};
