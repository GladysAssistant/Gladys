const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, AC_MODE } = require('../../../../utils/constants');

/**
 * @description Get Gladys device features from MELCloud device.
 * @param {string} externalId - External ID of the Gladys device.
 * @param {object} melCloudDevice - MELCloud device.
 * @returns {Array} Array of Gladys device features.
 * @example
 * getGladysDeviceFeatures('melcloud:123456789:1', melCloudDevice);
 */
function getGladysDeviceFeatures(externalId, melCloudDevice) {
  return [
    {
      name: 'Power',
      external_id: `${externalId}:power`,
      selector: `${externalId}:power`,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
    },
    {
      name: 'Mode',
      external_id: `${externalId}:mode`,
      selector: `${externalId}:mode`,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
    },
    {
      name: 'Temperature',
      external_id: `${externalId}:temperature`,
      selector: `${externalId}:temperature`,
      read_only: false,
      has_feedback: true,
      min: melCloudDevice.MinTemperature,
      max: melCloudDevice.MaxTemperature,
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
    },
  ];
}

const modesMELCloudToGladys = {
  1: AC_MODE.HEATING,
  2: AC_MODE.DRYING,
  3: AC_MODE.COOLING,
  7: AC_MODE.FAN,
  8: AC_MODE.AUTO,
};

const modesGaldysToMELCloud = {
  [AC_MODE.HEATING]: 1,
  [AC_MODE.DRYING]: 2,
  [AC_MODE.COOLING]: 3,
  [AC_MODE.FAN]: 7,
  [AC_MODE.AUTO]: 8,
};

/**
 * @description Transform value from MELCloud to Gladys.
 * @param {object} deviceFeature - Gladys device feature.
 * @param {object} values - MELCloud values.
 * @returns {number} Value.
 * @example
 * transfromValueFromMELCloud(deviceFeature, values);
 */
function transfromValueFromMELCloud(deviceFeature, values) {
  const [, , code] = deviceFeature.external_id.split(':');

  switch (code) {
    case 'power':
      return values.Power ? 1 : 0;
    case 'mode':
      return modesMELCloudToGladys[values.OperationMode];
    case 'temperature':
      return values.SetTemperature;
    default:
      return null;
  }
}

/**
 * @description Transform value from Gladys to MELCloud.
 * @param {object} deviceFeature - Gladys device feature.
 * @param {number} value - Gladys Value.
 * @returns {object} Value.
 * @example
 * transfromValueFromGladys(deviceFeature, value);
 */
function transfromValueFromGladys(deviceFeature, value) {
  const [, , code] = deviceFeature.external_id.split(':');

  switch (code) {
    case 'power':
      return {
        EffectiveFlags: 1,
        Power: value === 1,
      };
    case 'mode':
      return {
        EffectiveFlags: 6,
        OperationMode: modesGaldysToMELCloud[value],
      };
    case 'temperature':
      return {
        EffectiveFlags: 4,
        SetTemperature: value,
      };

    default:
      return null;
  }
}

module.exports = {
  getGladysDeviceFeatures,
  transfromValueFromMELCloud,
  transfromValueFromGladys,
};
