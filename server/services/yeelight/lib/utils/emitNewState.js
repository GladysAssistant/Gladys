const { EVENTS, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const { getDeviceFeature } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../features');

/**
 * @description Emit new state.
 * @param {Object} gladys - The gladys instance.
 * @param {Object} device - The device to update the state.
 * @param {string} featureType - The feature type.
 * @param {number} currentValue - The new state.
 * @example
 * emitNewState(gladys, device, featureType, currentValue);
 */
async function emitNewState(gladys, device, featureType, currentValue) {
  const feature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, featureType);

  if (feature && feature.last_value !== currentValue) {
    const deviceId = parseExternalId(device.external_id)[1];
    logger.debug(
      `Yeelight: Polling device ${deviceId}, ${featureType} change: ${feature.last_value} => ${currentValue}`,
    );

    const deviceFeatureExternalId = [device.external_id, featureType].join(':');
    await gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: deviceFeatureExternalId,
      state: currentValue,
    });
  }
}

module.exports = {
  emitNewState,
};
