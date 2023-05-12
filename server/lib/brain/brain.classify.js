const { ConversationContext } = require('node-nlp');

/**
 * @description Classify a message.
 * @param {string} message - The message to classify.
 * @param {string} language - The language of the message.
 * @param {object} context - The context of the conversation.
 * @returns {Promise} - Resolve with the context and the result.
 * @example
 * brain.classify('What time is it?', 'en');
 */
async function classify(message, language, context = new ConversationContext()) {
  const classification = await this.nlpManager.process(language, message, context);
  return {
    classification,
    context,
  };
}

module.exports = {
  classify,
};
