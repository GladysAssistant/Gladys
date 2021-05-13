const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description TurnOn a given deviceFeature.
 * @param {Object} device - The device to change brightness of.
 * @param {Object} deviceFeature - The deviceFeature to change brightness of.
 * @param {number} brightness - The brightness value.
 * @example
 * light.setBrightness(device, 5);
 */
async function setBrightness(device, deviceFeature, brightness) {
  logger.debug(`Setting the light brightness to "${brightness}"`);
  await this.deviceManager.setValue(device, deviceFeature, brightness);
  this.eventManager.emit(EVENTS.LIGHT.BRIGHTNESS_CHANGED, { device, deviceFeature, brightness });
}

module.exports = {
  setBrightness,
};
