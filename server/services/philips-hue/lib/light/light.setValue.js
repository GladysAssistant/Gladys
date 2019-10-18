const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/parseExternalId');
const { NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @description Change value of a Philips hue
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * turnOff(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  logger.debug(`Changing state of light ${device.external_id} with value = ${value}`);
  const { lightId, bridgeSerialNumber } = parseExternalId(device.external_id);
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  let state;
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      state = value === 1 ? new this.LightState().on() : new this.LightState().off();
      break;
    default:
      logger.debug(`Philips Hue : Feature type = "${deviceFeature.type}" not handled`);
      break;
  }
  await hueApi.lights.setLightState(lightId, state);
}

module.exports = {
  setValue,
};
