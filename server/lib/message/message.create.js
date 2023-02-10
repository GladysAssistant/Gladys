const { Op } = require('sequelize');

const logger = require('../../utils/logger');
const db = require('../../models');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @public
 * @description handle a new message sent by a user to Gladys.
 * @param {Object} message - A message sent by a user.
 * @param {string} message.text - The text of the message.
 * @param {string} message.language - The language of the message.
 * @param {string} message.source - The name of the service where the message comes from.
 * @param {string} message.source_user_id - The user id for the source service.
 * @param {Object} message.user - A user object.
 * @param {Object} message.id - Id of the message.
 * @example
 * message.create(message);
 */
async function create(message) {
  const gladysGatewayOpenAiEnabledVar = await this.variable.getValue(
    SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_OPEN_AI_ENABLED,
  );
  const openAiEnabled = gladysGatewayOpenAiEnabledVar === 'true';

  let classification;
  let context;

  if (!openAiEnabled) {
    console.log('starting classification');
    console.time('StartingClassification');

    // first, we classify the message to understand the intent
    ({ classification, context } = await this.brain.classify(message.text, message.language, {
      user: message.user,
    }));

    console.timeEnd('StartingClassification');

    logger.debug(`Classified "${message.text}" with intent = "${classification.intent}".`);
    logger.debug(classification);

    // if Gladys doesn't understand
    if (classification.intent === 'None') {
      this.replyByIntent(message, 'question.no-intent-found', context);
    }
  } else {
    context = {
      user: message.user,
    };
    const previousMessages = await db.Message.findAll({
      where: {
        [Op.or]: [{ sender_id: message.user.id }, { receiver_id: message.user.id }],
      },
      order: [['created_at', 'desc']],
      limit: 10,
    });
    const lastUserQuestion = previousMessages.find((msg) => msg.sender_id !== null);
    const lastGladysAnswer = previousMessages.find((msg) => msg.sender_id === null);
    const previousQuestions = [];
    if (lastUserQuestion && lastGladysAnswer) {
      previousQuestions.push({
        question: lastUserQuestion.text,
        answer: lastGladysAnswer.text,
      });
    }
    this.event.emit(EVENTS.MESSAGE.NEW_FOR_OPEN_AI, { message, previousQuestions, context });
  }

  const messageToInsert = {
    text: message.text,
    sender_id: message.user.id,
    receiver_id: null,
    is_read: true,
    id: message.id,
  };

  await db.Message.create(messageToInsert);

  if (!openAiEnabled) {
    if (classification.answer) {
      // if a first answer needs to be sent, send it
      await this.reply(message, classification.answer, classification.context);
    }

    // new classification found, emitting event
    this.event.emit(`intent.${classification.intent}`, message, classification, context);
  }

  return {
    message,
    classification,
  };
}

module.exports = {
  create,
};
