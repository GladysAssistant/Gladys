const { BadParameters } = require('../../../utils/coreErrors');
const { readValues } = require('./device/tuya.deviceMapping');
const { getDpsMappingForDevice } = require('./models');
const { API } = require('./utils/tuya.constants');
const { EVENTS } = require('../../../utils/constants');

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
  const sources = {};
  (response.result || []).forEach((feature) => {
    values[feature.code] = feature.value;
    sources[feature.code] = 'cloud';
  });

  // Optionally map local DPS values to codes if we have a mapping and local DPS stored.
  const dpsMapping = getDpsMappingForDevice(device);
  const dpsParam =
    Array.isArray(device.params) && device.params.find((param) => param.name === 'TUYA_DP_MAP');
  const localOverrideParam =
    Array.isArray(device.params) && device.params.find((param) => param.name === 'LOCAL_OVERRIDE');
  const localOverride = localOverrideParam ? localOverrideParam.value === true || localOverrideParam.value === 'true' : false;

  if (dpsMapping && dpsParam && typeof dpsParam.value === 'string' && localOverride) {
    try {
      const parsed = JSON.parse(dpsParam.value);
      if (parsed && parsed.dps) {
        dpsMapping.dps.forEach((entry) => {
          const rawValue = parsed.dps[entry.id];
          if (rawValue !== undefined) {
            values[entry.code] = rawValue;
            sources[entry.code] = 'local';
          }
        });
      }
    } catch (e) {
      // ignore invalid mapping payload
    }
  }

  // Normalize values using DPS mapping (applies to both cloud and local values)
  if (dpsMapping && Array.isArray(dpsMapping.dps)) {
    dpsMapping.dps.forEach((entry) => {
      if (values[entry.code] === undefined) {
        return;
      }
      let mappedValue = values[entry.code];
      if (entry.map && typeof entry.map === 'object' && entry.map[mappedValue] !== undefined) {
        mappedValue = entry.map[mappedValue];
      }
      if (entry.scale) {
        const numeric = typeof mappedValue === 'number' ? mappedValue : parseFloat(mappedValue);
        if (!Number.isNaN(numeric)) {
          mappedValue = numeric * entry.scale;
        }
      }
      values[entry.code] = mappedValue;
    });
  }

  device.features.forEach((deviceFeature) => {
    const [, , code] = deviceFeature.external_id.split(':');

    const value = values[code];
    const categoryMapping = readValues[deviceFeature.category];
    if (!categoryMapping || !categoryMapping[deviceFeature.type]) {
      if (this.logger && this.logger.debug) {
        this.logger.debug(
          `[Tuya][poll] Skip feature "${deviceFeature.external_id}" - no mapping for ${deviceFeature.category}/${deviceFeature.type}`
        );
      }
      return;
    }
    const transformedValue = categoryMapping[deviceFeature.type](value);

    if (deviceFeature.last_value !== transformedValue) {
      if (transformedValue !== null && transformedValue !== undefined) {
        const source = sources[code] || 'cloud';
        this.logger && this.logger.debug && this.logger.debug(
          `[Tuya][poll] ${device.external_id}:${code} value=${transformedValue} source=${source}`
        );
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
