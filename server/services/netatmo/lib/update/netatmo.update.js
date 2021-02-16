/* eslint-disable jsdoc/check-param-names */
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { getDeviceFeatureBySelector } = require('../../../../utils/device');
const { compareValue } = require('../utils/format');
const logger = require('../../../../utils/logger');

/**
 * @description Poll value of a Netatmo devices
 * @param {string} key - Data received.
 * @param {Object} device - Data received.
 * @param {string} deviceSelector - Data received.
 * @param {string} featureType - Data received.
 * @param {number|boolean} newValue - Data received.
 * @example
 * updateNHC();
 */
async function updateFeature(key, device, deviceSelector, featureType, newValue) {
  try {
    const featureTypeSelector = `${deviceSelector}-${featureType.replace(/_/gi, '-').toLowerCase()}`;
    const feature = await getDeviceFeatureBySelector(device, featureTypeSelector);
    if (compareValue(feature.last_value, newValue)) {
      if (feature.last_value !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:${featureType}`,
          state: feature.last_value,
        });
      }
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:${featureType}`,
        state: newValue,
      });
    } else {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
        device_feature_external_id: `netatmo:${key}:${featureType}`,
      });
    }
  } catch (e) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: `${this.devices[key].type} ${this.devices[key].name} - ${featureType} - ${e}`,
    });
    logger.error(`${this.devices[key].type} ${this.devices[key].name} - ${featureType} - ${e}`);
  }
}

module.exports = {
  updateFeature,
};
