const { keyMappings } = require('./mappings');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

/**
 * @description Send button key to TV.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The binary deviceFeature to control.
 * @param {number} value - The new value.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  console.log(`Changing state ${device.external_id} with value = ${value}`);

  const keyMapping = keyMappings[deviceFeature.category][deviceFeature.type];
  if (!keyMapping) {
    return;
  }

  const androidTV = this.androidTVs[device.id];
  if (!androidTV) {
    return;
  }

  switch (`${deviceFeature.category}:${deviceFeature.type}`) {
    case `${DEVICE_FEATURE_CATEGORIES.TELEVISION}:${DEVICE_FEATURE_TYPES.TELEVISION.VOLUME}`: {
      const volDiff = value - deviceFeature.last_value;
      for (let i = 0; i < Math.abs(volDiff); i += 1) {
        androidTV.sendKey(keyMapping.KeyCode[volDiff < 0 ? 0 : 1], keyMapping.Direction);
      }
      break;
    }
    default:
      androidTV.sendKey(keyMapping.KeyCode, keyMapping.Direction);
      break;
  }
}

module.exports = {
  setValue,
};
