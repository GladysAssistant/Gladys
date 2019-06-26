const logger = require('../../../utils/logger');
const { STATE, EVENTS } = require('../../../utils/constants');

/**
 * @description TurnOn a given deviceFeature.
 * @param {Object} device - The device to turnOn.
 * @param {Object} deviceFeature - The deviceFeature to turnOn.
 * @example
 * light.turnOn(device, deviceFeature);
 */
async function turnOn(device, deviceFeature) {
  logger.debug(`Turning on the light of deviceFeature "${deviceFeature.selector}"`);
  await this.deviceManager.setValue(device, deviceFeature, 'light', 'turnOn', STATE.ON);
  this.eventManager.emit(EVENTS.LIGHT.TURNED_ON, { device, deviceFeature });
}

module.exports = {
  turnOn,
};
