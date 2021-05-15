const logger = require('../../../utils/logger');
const { STATE, EVENTS } = require('../../../utils/constants');

/**
 * @description TurnOff a given deviceFeature.
 * @param {Object} device - The device to turnOff.
 * @param {Object} deviceFeature - The deviceFeature to turnOff.
 * @example
 * mediaPlayer.turnOff(device, deviceFeature);
 */
async function turnOff(device, deviceFeature) {
  logger.debug(`Turning off the media player of deviceFeature "${deviceFeature.selector}"`);
  await this.deviceManager.setValue(device, deviceFeature, STATE.OFF);
  this.eventManager.emit(EVENTS.MEDIA_PLAYER.TURNED_OFF, { device, deviceFeature });
}

module.exports = {
  turnOff,
};
