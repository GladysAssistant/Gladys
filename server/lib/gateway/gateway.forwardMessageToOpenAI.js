const intentTranslation = {
  SHOW_CAMERA: 'camera.get-image-room',
  TURN_ON: 'light.turn-on',
  TURN_OFF: 'light.turn-off',
  GET_TEMPERATURE: 'temperature-sensor.get-in-room',
  GET_HUMIDITY: 'humidity-sensor.get-in-room',
  INFO: 'info.get-info',
};

const disableOpenAiFirstReply = new Set(['GET_TEMPERATURE', 'GET_HUMIDITY']);

/**
 * @public
 * @description handle a new message sent by a user to Gladys.
 * @param {Object} request - A request sent.
 * @param {Array} request.previousQuestions - List of previous messages.
 * @param {Object} request.context - Context of messages (user, etc...).
 * @param {Object} request.message - A message sent by a user.
 * @param {string} request.message.text - The text of the message.
 * @param {string} request.message.language - The language of the message.
 * @param {string} request.message.source - The name of the service where the message comes from.
 * @param {string} request.message.source_user_id - The user id for the source service.
 * @param {Object} request.message.user - A user object.
 * @param {Object} request.message.id - Id of the message.
 * @example
 * forwardMessageToOpenAI(request);
 */
async function forwardMessageToOpenAI({ message, previousQuestions, context }) {
  const response = await this.openAIAsk({
    question: message.text,
    previous_questions: previousQuestions,
  });

  const classification = {};

  // add room entity
  if (response.room) {
    const roomId = this.brain.getEntityIdByName('room', response.room.toLowerCase());
    classification.entities = [{ entity: 'room', option: roomId, sourceText: response.room }];
  }

  classification.intent = intentTranslation[response.type];

  // Reply with OpenAI response
  if (!disableOpenAiFirstReply.has(response.type)) {
    await this.message.reply(message, response.answer);
  }

  if (classification.intent) {
    this.event.emit(`intent.${classification.intent}`, message, classification, context);
  }

  return classification;
}

module.exports = {
  forwardMessageToOpenAI,
};
