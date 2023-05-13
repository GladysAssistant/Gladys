const logger = require('../../../utils/logger');
const { STATE, EVENTS } = require('../../../utils/constants');

/**
 * @description TurnOff a given deviceFeature.
 * @param {object} device - The device to turnOff.
 * @param {object} deviceFeature - The deviceFeature to turnOff.
 * @example
 * light.turnOff(device, deviceFeature);
 */
async function turnOff(device, deviceFeature) {
  logger.debug(`Turning off the light of deviceFeature "${deviceFeature.selector}"`);
  await this.deviceManager.setValue(device, deviceFeature, STATE.OFF);
  this.eventManager.emit(EVENTS.LIGHT.TURNED_OFF, { device, deviceFeature });
}

module.exports = {
  turnOff,
};
