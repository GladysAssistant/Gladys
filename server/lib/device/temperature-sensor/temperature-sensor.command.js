const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { NotFoundError, NoValuesFoundError } = require('../../../utils/coreErrors');

/**
 * @description Get the average temperature in a room.
 * @param {object} message - The message sent by the user.
 * @param {object} classification - The classification calculated by the brain.
 * @param {object} context - The context object containing found variables in question.
 * @returns {Promise} Resolve when command was executed.
 * @example
 * command(message, classification, context);
 */
async function command(message, classification, context) {
  let temperatureResult;
  const roomEntity = classification.entities.find((entity) => entity.entity === 'room');
  try {
    switch (classification.intent) {
      case 'temperature-sensor.get-in-room':
        if (!roomEntity) {
          throw new NotFoundError('Room not found');
        }
        temperatureResult = await this.getTemperatureInRoom(roomEntity.option, {
          unit: context.user.temperature_unit_preference,
        });
        if (temperatureResult.temperature === null) {
          throw new NoValuesFoundError('No temperature values found in this room.');
        }
        context.temperature = Math.round(temperatureResult.temperature);
        context.unit = temperatureResult.unit === DEVICE_FEATURE_UNITS.CELSIUS ? '°C' : '°F';
        context.roomName = roomEntity.sourceText;
        this.messageManager.replyByIntent(message, `temperature-sensor.get-in-room.success`, context);
        break;
      default:
        throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    if (e instanceof NotFoundError && e.message === 'Room not found') {
      this.messageManager.replyByIntent(message, 'temperature-sensor.get-in-room.fail.room-not-found', context);
    } else if (e instanceof NoValuesFoundError) {
      this.messageManager.replyByIntent(message, 'temperature-sensor.get-in-room.fail.no-results', context);
    } else {
      this.messageManager.replyByIntent(message, 'temperature-sensor.get-in-room.fail', context);
    }
  }
  return null;
}

module.exports = {
  command,
};
