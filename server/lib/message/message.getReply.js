const logger = require('../../utils/logger');

/**
 * @public
 * @description handle a new message sent by a service to Gladys.
 * @param {string} message - The text of the message.
 * @param {string} language - The language of the message.
 * @returns {string} The reply.
 * @example
 * message.getReply(message);
 */
async function getReply(message, language) {
  // first, we classify the message to understand the intent
  const { classification } = await this.brain.classify(message, language);

  logger.debug(`Classified "${message}" with intent = "${classification.intent}".`);
  logger.debug(classification);
  let reply = '';
  // if Gladys doesn't understand
  if (classification.intent === 'None') {
    reply = 'What ?';
  } else {
    reply = classification.answer;
  }
  return reply;
}

module.exports = {
  getReply,
};
