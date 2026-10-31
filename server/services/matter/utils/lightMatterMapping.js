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

// Matter device type IDs of the plugs and load controls. A dimmable one must expose LevelControl
// with the lighting feature, which becomes a light brightness: its OnOff must stay a switch anyway,
// or wall outlets and in-wall dimmers would join the light scenes.
const MATTER_PLUG_DEVICE_TYPE = {
  ON_OFF_PLUG_IN_UNIT: 0x010a,
  DIMMABLE_PLUG_IN_UNIT: 0x010b,
  MOUNTED_ON_OFF_CONTROL: 0x010f,
  MOUNTED_DIMMABLE_LOAD_CONTROL: 0x0110,
};

const MATTER_PLUG_DEVICE_TYPE_CODES = Object.values(MATTER_PLUG_DEVICE_TYPE);

/**
 * @description Tells if a Matter endpoint is a light. The declared device type wins: a lighting
 * device type is a light, a plug or load control device type is not. Otherwise the endpoint is a
 * light when it already got a light feature (brightness from LevelControl with the lighting
 * feature, color from ColorControl): this covers the endpoints declaring no usable device type,
 * and is the rule the migration of already paired devices relies on.
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
  if (
    Array.isArray(deviceTypes) &&
    deviceTypes.some((deviceType) => deviceType && MATTER_PLUG_DEVICE_TYPE_CODES.includes(deviceType.code))
  ) {
    return false;
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
  MATTER_PLUG_DEVICE_TYPE,
  isLightEndpoint,
  applyLightCategoryToOnOff,
};
