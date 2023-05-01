const { ConversationContext } = require('node-nlp');

const Handlebars = require('handlebars');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get the reply for a given intent.
 * @param {string} language - The language of the message.
 * @param {string} intent - The intent of the message.
 * @param {object} context - The context of the conversation.
 * @returns {string} - Return a text.
 * @example
 * brain.getReply('en', 'light.turn-on.success');
 */
function getReply(language, intent, context = new ConversationContext()) {
  const text = this.nlpManager.findAllAnswers(language, intent);
  if (text.length === 0) {
    throw new NotFoundError(`Answer with intent ${intent} and language ${language} not found`);
  }
  return Handlebars.compile(text[0].answer)(context);
}

module.exports = {
  getReply,
};
