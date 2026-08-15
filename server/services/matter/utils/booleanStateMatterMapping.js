const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

// Matter device type IDs (Matter Device Library specification) of the sensors built on top of the
// BooleanState cluster. The cluster itself only exposes a raw `StateValue` boolean, so the device
// type of the endpoint is the only thing telling us what that boolean actually means.
const MATTER_DEVICE_TYPE = {
  CONTACT_SENSOR: 0x0015,
  WATER_FREEZE_DETECTOR: 0x0041,
  WATER_LEAK_DETECTOR: 0x0043,
  RAIN_SENSOR: 0x0044,
};

// Mapping between the Matter device type of the endpoint and the Gladys feature to create for the
// BooleanState cluster.
//
// Polarity of the `StateValue` attribute, per the Matter Device Library specification, compared to
// the Gladys semantics of each category:
// - Water Leak Detector: StateValue = true means a leak is detected. Gladys `leak-sensor/binary`
//   uses 1 = leak detected, so the value is used as-is.
// - Rain Sensor: StateValue = true means rain is detected. Gladys `rain-sensor/binary` uses
//   1 = rain detected, so the value is used as-is.
// - Contact Sensor: StateValue = true means the contact is closed (false means open). Gladys
//   `opening-sensor/binary` uses OPENING_SENSOR_STATE.CLOSE = 1 and OPENING_SENSOR_STATE.OPEN = 0,
//   so the value is used as-is here too.
//
// The three mappings above are therefore all `StateValue ? 1 : 0`, which is what
// `matter.listenToStateChange` and `matter.readInitialDeviceStates` already emit.
//
// The Water Freeze Detector device type is deliberately absent: Gladys has no frost/freeze
// category, so those endpoints keep the generic read-only switch feature below.
const MATTER_DEVICE_TYPE_TO_GLADYS_BOOLEAN_STATE_FEATURE = {
  [MATTER_DEVICE_TYPE.CONTACT_SENSOR]: {
    category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
  },
  [MATTER_DEVICE_TYPE.WATER_LEAK_DETECTOR]: {
    category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
  },
  [MATTER_DEVICE_TYPE.RAIN_SENSOR]: {
    category: DEVICE_FEATURE_CATEGORIES.RAIN_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
  },
};

// Fallback used when the endpoint exposes no device type we know about. It is the historical
// mapping of the BooleanState cluster, kept so already paired devices are not broken.
const DEFAULT_BOOLEAN_STATE_FEATURE = {
  category: DEVICE_FEATURE_CATEGORIES.SWITCH,
  type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
};

/**
 * @description Get the Gladys category/type to use for the BooleanState cluster of an endpoint,
 * based on the Matter device type(s) declared by this endpoint.
 * @param {object} device - The Matter endpoint exposing the BooleanState cluster.
 * @returns {{category: string, type: string}} The Gladys category and type of the feature.
 * @example
 * const { category, type } = getBooleanStateFeatureCategoryAndType(device);
 */
function getBooleanStateFeatureCategoryAndType(device) {
  const deviceTypes = device && typeof device.getDeviceTypes === 'function' ? device.getDeviceTypes() : undefined;
  if (Array.isArray(deviceTypes)) {
    const matchingDeviceType = deviceTypes.find(
      (deviceType) => deviceType && MATTER_DEVICE_TYPE_TO_GLADYS_BOOLEAN_STATE_FEATURE[deviceType.code],
    );
    if (matchingDeviceType) {
      return MATTER_DEVICE_TYPE_TO_GLADYS_BOOLEAN_STATE_FEATURE[matchingDeviceType.code];
    }
  }
  return DEFAULT_BOOLEAN_STATE_FEATURE;
}

module.exports = {
  MATTER_DEVICE_TYPE,
  DEFAULT_BOOLEAN_STATE_FEATURE,
  getBooleanStateFeatureCategoryAndType,
};
