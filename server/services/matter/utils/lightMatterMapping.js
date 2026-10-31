const {
  OnOff,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

// Matter device type IDs (Matter Device Library specification) of the lighting device types. Each
// of them carries the OnOff cluster, which must then be a light on/off and not a generic switch.
const MATTER_LIGHT_DEVICE_TYPE = {
  ON_OFF_LIGHT: 0x0100,
  DIMMABLE_LIGHT: 0x0101,
  COLOR_TEMPERATURE_LIGHT: 0x010c,
  EXTENDED_COLOR_LIGHT: 0x010d,
};

const MATTER_LIGHT_DEVICE_TYPE_CODES = Object.values(MATTER_LIGHT_DEVICE_TYPE);

/**
 * @description Tells if a Matter endpoint is a light: either it declares a lighting device type,
 * or it already got a light feature (brightness from LevelControl with the lighting feature, color
 * from ColorControl). The second rule covers the endpoints declaring no usable device type, and is
 * the one the migration of already paired devices relies on.
 * @param {object} device - The Matter endpoint.
 * @param {Array} features - The Gladys features built for this endpoint.
 * @returns {boolean} True when the endpoint is a light.
 * @example
 * const isLight = isLightEndpoint(device, gladysDevice.features);
 */
function isLightEndpoint(device, features) {
  const deviceTypes = device && typeof device.getDeviceTypes === 'function' ? device.getDeviceTypes() : undefined;
  if (
    Array.isArray(deviceTypes) &&
    deviceTypes.some((deviceType) => deviceType && MATTER_LIGHT_DEVICE_TYPE_CODES.includes(deviceType.code))
  ) {
    return true;
  }
  return features.some((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT);
}

/**
 * @description Turns the OnOff feature of a light endpoint into a light on/off, so the dashboard
 * groups it with the brightness and color of the same lamp, and the light scenes reach it. The
 * feature type stays `binary`, which is what matter.setValue matches on.
 * @param {object} device - The Matter endpoint.
 * @param {Array} features - The Gladys features built for this endpoint, updated in place.
 * @example
 * applyLightCategoryToOnOff(device, gladysDevice.features);
 */
function applyLightCategoryToOnOff(device, features) {
  if (!isLightEndpoint(device, features)) {
    return;
  }
  features.forEach((feature) => {
    if (
      feature.category === DEVICE_FEATURE_CATEGORIES.SWITCH &&
      feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY &&
      feature.external_id.endsWith(`:${OnOff.Complete.id}`)
    ) {
      feature.category = DEVICE_FEATURE_CATEGORIES.LIGHT;
      feature.type = DEVICE_FEATURE_TYPES.LIGHT.BINARY;
    }
  });
}

module.exports = {
  MATTER_LIGHT_DEVICE_TYPE,
  isLightEndpoint,
  applyLightCategoryToOnOff,
};
