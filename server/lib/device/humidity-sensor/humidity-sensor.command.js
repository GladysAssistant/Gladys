const logger = require('../../../utils/logger');
const { NotFoundError, NoValuesFoundError } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_UNITS } = require('../../../utils/constants');

/**
 * @description Execute humidity sensor command.
 * @param {object} message - The message sent by the user.
 * @param {object} classification - The classification calculated by the brain.
 * @param {object} context - The context object containing found variables in question.
 * @returns {Promise} Resolve when command was executed.
 * @example
 * command(message, classification, context);
 */
async function command(message, classification, context) {
  let humidityResult;
  const roomEntity = classification.entities.find((entity) => entity.entity === 'room');
  try {
    switch (classification.intent) {
      case 'humidity-sensor.get-in-room':
        if (!roomEntity) {
          throw new NotFoundError('Room not found');
        }
        humidityResult = await this.getHumidityInRoom(roomEntity.option, {
          unit: DEVICE_FEATURE_UNITS.PERCENT,
        });
        if (humidityResult.humidity === null) {
          throw new NoValuesFoundError('No humidity values found in this room.');
        }
        context.humidity = Math.round(humidityResult.humidity);
        context.unit = DEVICE_FEATURE_UNITS.PERCENT;
        context.roomName = roomEntity.sourceText;
        this.messageManager.replyByIntent(message, `humidity-sensor.get-in-room.success`, context);
        break;
      default:
        throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    if (e instanceof NotFoundError && e.message === 'Room not found') {
      this.messageManager.replyByIntent(message, 'humidity-sensor.get-in-room.fail.room-not-found', context);
    } else if (e instanceof NoValuesFoundError) {
      this.messageManager.replyByIntent(message, 'humidity-sensor.get-in-room.fail.no-results', context);
    } else {
      this.messageManager.replyByIntent(message, 'humidity-sensor.get-in-room.fail', context);
    }
  }
  return null;
}

module.exports = {
  command,
};
