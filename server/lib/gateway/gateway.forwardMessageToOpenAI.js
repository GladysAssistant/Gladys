const { Error429 } = require('../../utils/httpErrors');

const intentTranslation = {
  SHOW_CAMERA: 'camera.get-image',
  TURN_ON: 'light.turn-on',
  TURN_OFF: 'light.turn-off',
  GET_TEMPERATURE: 'temperature-sensor.get-in-room',
  GET_HUMIDITY: 'humidity-sensor.get-in-room',
  SCENE_START: 'scene.start',
  INFO: 'info.get-info',
};

const disableOpenAiFirstReply = new Set(['GET_TEMPERATURE', 'GET_HUMIDITY']);

/**
 * @public
 * @description Handle a new message sent by a user to Gladys.
 * @param {object} request - A request sent.
 * @param {object} request.message - A message sent by a user.
 * @param {Array} request.previousQuestions - List of previous messages.
 * @param {object} request.context - Context of messages (user, etc...).
 * @returns {Promise} Return classification.
 * @example
 * forwardMessageToOpenAI(request);
 */
async function forwardMessageToOpenAI({ message, previousQuestions, context }) {
  try {
    const response = await this.openAIAsk({
      question: message.text,
      previous_questions: previousQuestions,
    });

    const classification = {};

    // add room entity
    if (response.room) {
      const roomId = this.brain.getEntityIdByName('room', response.room);
      classification.entities = [{ entity: 'room', option: roomId, sourceText: response.room }];
    }

    // add scene entity
    if (response.scene) {
      const sceneSelector = this.brain.getEntityIdByName('scene', response.scene);
      classification.entities = [{ entity: 'scene', option: sceneSelector, sourceText: response.scene }];
    }

    // add device entity
    if (response.device) {
      const deviceSelector = this.brain.getEntityIdByName('device', response.device);
      classification.entities = [{ entity: 'device', option: deviceSelector, sourceText: response.device }];
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
  } catch (e) {
    if (e instanceof Error429) {
      await this.message.replyByIntent(message, 'openai.request.tooManyRequests', context);
    } else {
      await this.message.replyByIntent(message, 'openai.request.fail', context);
    }
    return null;
  }
}

module.exports = {
  forwardMessageToOpenAI,
};
