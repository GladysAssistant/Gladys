const { BadParameters } = require('../../../utils/coreErrors');
const { readValues } = require('./device/tuya.deviceMapping');
const { API } = require('./utils/tuya.constants');
const { EVENTS } = require('../../../utils/constants');

const getCurrentFeatureLastValue = (gladys, deviceFeature) => {
  if (!deviceFeature) {
    return undefined;
  }
  if (deviceFeature.selector && gladys && gladys.stateManager && typeof gladys.stateManager.get === 'function') {
    const currentFeature = gladys.stateManager.get('deviceFeature', deviceFeature.selector);
    if (currentFeature && Object.prototype.hasOwnProperty.call(currentFeature, 'last_value')) {
      return currentFeature.last_value;
    }
  }
  return deviceFeature.last_value;
};

/**
 *
 * @description Poll values of an Tuya device.
 * @param {object} device - The device to poll.
 * @returns {Promise} Promise of nothing.
 * @example
 * poll(device);
 */
async function poll(device) {
  const externalId = device.external_id;
  const [prefix, topic] = device.external_id.split(':');

  if (prefix !== 'tuya') {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" should starts with "tuya:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" have no network indicator`);
  }

  const response = await this.connector.request({
    method: 'GET',
    path: `${API.VERSION_1_0}/devices/${topic}/status`,
  });

  const values = {};
  (response.result || []).forEach((feature) => {
    values[feature.code] = feature.value;
  });

  device.features.forEach((deviceFeature) => {
    const [, , code] = deviceFeature.external_id.split(':');

    const value = values[code];
    const transformedValue = readValues[deviceFeature.category][deviceFeature.type](value);
    const currentLastValue = getCurrentFeatureLastValue(this.gladys, deviceFeature);

    if (currentLastValue !== transformedValue) {
      if (transformedValue !== null && transformedValue !== undefined) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: deviceFeature.external_id,
          state: transformedValue,
        });
      }
    }
  });
}

module.exports = {
  poll,
};
