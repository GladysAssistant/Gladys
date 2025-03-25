const { BadParameters } = require('../../../utils/coreErrors');
const { readValues } = require('./device/tuya.deviceMapping');
const { API, INFRARED_MODELS } = require('./utils/tuya.constants');
const { EVENTS, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

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

  if (device.model === INFRARED_MODELS.INFRARED_TV) {
    const gatewayId = topic.split('_')[1];
    const deviceId = topic.split('_')[0];
    const response = await this.connector.request({
      method: 'GET',
      path: `${API.VERSION_2_0}/infrareds/${gatewayId}/remotes/${deviceId}/ac/status`,
    });

    const values = response.result || {};
    device.features.forEach((deviceFeature) => {
      const [, , code] = deviceFeature.external_id.split(':');
      const value = values[code];
      if (deviceFeature.last_value !== Number(value)) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: deviceFeature.external_id,
          state: Number(value),
        });
      }
    });
  } else {
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

      if (deviceFeature.last_value !== transformedValue) {
        if (transformedValue !== null && transformedValue !== undefined) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: deviceFeature.external_id,
            state: transformedValue,
            text:
              deviceFeature.type === DEVICE_FEATURE_TYPES.SENSOR.JSON ? transformedValue : undefined,
          });
        }
      }
    });
  }
}

module.exports = {
  poll,
};
