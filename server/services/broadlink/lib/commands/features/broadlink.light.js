const deviceClasses = require('node-broadlink/dist/light');
const { intToRgb } = require('../../../../../utils/colors');

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../utils/constants');

/**
 * @description Builds light Broadlink features.
 * @param {string} deviceName - Device name.
 * @param {string} deviceExternalId - Device external ID.
 * @returns {Array} Gladys features.
 * @example
 * buildFeatures(a1Device);
 */
function buildFeatures(deviceName, deviceExternalId) {
  return [
    // light switch
    {
      name: `${deviceName}`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      external_id: `${deviceExternalId}:light:binary`,
      selector: `${deviceExternalId}:light:binary`,
      min: 0,
      max: 1,
      read_only: false,
      has_feedback: false,
    },
    // light color
    {
      name: `${deviceName} color`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      external_id: `${deviceExternalId}:light:color`,
      selector: `${deviceExternalId}:light:color`,
      min: 1,
      max: 16777215,
      read_only: false,
      has_feedback: false,
    },
    // light brightness
    {
      name: `${deviceName} brightness`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      external_id: `${deviceExternalId}:light:brightness`,
      selector: `${deviceExternalId}:light:brightness`,
      min: 0,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
      read_only: false,
      has_feedback: false,
    },
    // light temperature
    {
      name: `${deviceName} temperature`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
      external_id: `${deviceExternalId}:light:temperature`,
      selector: `${deviceExternalId}:light:temperature`,
      min: 0,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
      read_only: false,
      has_feedback: false,
    },
  ];
}

/**
 * @description Send value to switch device.
 * @param {object} broadlinkDevice - Broadlink device.
 * @param {object} gladysDevice - Gladys device.
 * @param {object} gladysFeature - Gladys feature.
 * @param {number} value - Value to send.
 * @example
 * await setValue({}, {}, {}, 3);
 */
async function setValue(broadlinkDevice, gladysDevice, gladysFeature, value) {
  const { type } = gladysFeature;

  const state = {};

  switch (type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      state.pwr = value === 1;
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.COLOR: {
      const [red, blue, green] = intToRgb(value);
      state.red = red;
      state.blue = blue;
      state.green = green;
      break;
    }
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS:
      state.brightness = value;
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE:
      state.colortemp = value;
      break;
    default:
    // NO-OP
  }

  await broadlinkDevice.setState(state);
}

module.exports = {
  deviceClasses,
  buildFeatures,
  setValue,
  canLearn: false,
};
