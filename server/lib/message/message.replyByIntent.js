/**
 * @description Reply to the user with a given intent.
 * @param {object} originalMessage - The original message sent by the user.
 * @param {string} originalMessage.language - The language of the message.
 * @param {string} originalMessage.source - The service which received the message.
 * @param {string} originalMessage.source_user_id - The unique identifier of the user on the source platform.
 * @param {object} originalMessage.user - The user asking.
 * @param {string} intent - The intent to send.
 * @param {object} context - The context of the reply.
 * @param {string} [file] - An optional file to send with the message.
 * @example
 * message.replyByIntent('en','light.turn-on.success',{ deviceFeature: {name: 'test'} },'telegram', 'XXXX');
 */
async function replyByIntent(originalMessage, intent, context, file) {
  const text = this.brain.getReply(originalMessage.language, intent, context);
  await this.reply(originalMessage, text, context, file);
}

module.exports = {
  replyByIntent,
};
