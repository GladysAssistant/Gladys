const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { LIGHT_EXTERNAL_ID_BASE } = require('../utils/consts');

const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/parseExternalId');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceFeature } = require('../../../../utils/device');

/**
 * @description Poll value of a Philips hue.
 * @param {object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {
  const { lightId, bridgeSerialNumber } = parseExternalId(device.external_id);
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  const state = await hueApi.lights.getLightState(lightId);
  const currentBinaryState = state.on ? 1 : 0;
  const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY);

  // if the value is different from the value we have, save new state
  if (binaryFeature && binaryFeature.last_value !== currentBinaryState) {
    logger.debug(`Polling Philips Hue ${lightId}, new value = ${currentBinaryState}`);
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${lightId}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
      state: currentBinaryState,
    });
  }
}

module.exports = {
  poll,
};
