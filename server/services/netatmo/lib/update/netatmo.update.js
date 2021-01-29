/* eslint-disable jsdoc/check-param-names */
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureBySelector } = require('../../../../utils/device');
const { compareValue } = require('../../../../utils/format');

/**
 * @description Poll value of a Netatmo devices
 * @param {string} key - Data received.
 * @param {Object} device - Data received.
 * @param {string} deviceSelector - Data received.
 * @param {string} featureType - Data received.
 * @param {string|number|boolean} newValue - Data received.
 * @example
 * updateNHC();
 */
async function updateFeature(key, device, deviceSelector, featureType, newValue) {
  const featureTypeSelector = `${deviceSelector}-${featureType.replace(/_/gi, '-').toLowerCase()}`;
  const feature = await getDeviceFeatureBySelector(device, featureTypeSelector);
  if (compareValue(feature.last_value, newValue)) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${key}:${featureType}`,
      state: newValue,
    });
  } else {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
      device_feature_external_id: `netatmo:${key}:${featureType}`,
    });
  }
}

module.exports = {
  updateFeature,
};
