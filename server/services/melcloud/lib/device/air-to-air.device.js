const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, AC_MODE } = require('../../../../utils/constants');

/**
 * @description MELCloud Air to Air device.
 * @example
 * const airToAirDevice = new AirToAirDevice();
 */

/**
 *
 * @param externalId
 * @param melCloudDevice
 * @example
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
 *
 * @param deviceFeature
 * @param values
 * @example
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
 *
 * @param deviceFeature
 * @param value
 * @example
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
