const { BadParameters } = require('../../../utils/coreErrors');
const { readValues } = require('./device/tuya.deviceMapping');
const { API } = require('./utils/tuya.constants');
const { EVENTS, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { convertFeature } = require('./utils/tuya.convertFeature');
const { isString } = require('mathjs');

/**
 *
 * @description Poll values of an Tuya device.
 * @param {object} data - The device to poll.
 * @returns {Promise} Promise of nothing.
 * @example
 * handleFeedbackFromTuya(data);
 */
async function handleFeedbackFromTuya(data) {
  const device = this.gladys.stateManager.get('deviceByExternalId', `tuya:${data.key}`);
  if (!device) {
    logger.warn(`Tuya device ${data.key} not configured in gladys.`);
    return;
  } else {
    data.payload.data.status.forEach((tuyaFeatureDevice) => {
      // Find the feature regarding the field name
      const value = tuyaFeatureDevice.value;
      const feature = convertFeature(device.features, tuyaFeatureDevice.code, value);
      if (feature) {
        try {
          const transformedValue = readValues[feature.category][feature.type](value);
          if (feature.last_value !== transformedValue) {
            if (transformedValue !== null && transformedValue !== undefined) {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: feature.external_id,
                state: transformedValue,
                text:
                  feature.type === DEVICE_FEATURE_TYPES.SENSOR.JSON
                    ? isString(transformedValue)
                      ? transformedValue
                      : JSON.stringify(transformedValue)
                    : undefined,
              });
            }
          }
        } catch (e) {}
      } else {
      }
    });
  }
}

module.exports = {
  handleFeedbackFromTuya,
};
