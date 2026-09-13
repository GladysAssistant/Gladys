const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

// Zigbee "text" exposes carry a free-form string built by the device itself: diagnostic states
// saying whether the device is normal, or which of its abnormal states are currently raised —
// the device joins them together ("fault | pollution_fault"). Such a list is device-specific and
// no generic Gladys value set can describe it, so they are published as text features, keeping
// the string the device sends, unless "normal or not" is all there is to know: the mapping then
// declares its normalValue and the feature becomes a binary one.
const NORMAL_VALUE = 'normal';

const names = {
  // Fault status of a smoke detector, e.g. Heiman HS1SA-E-PLUS: "normal", or the faults it
  // currently raises ("fault | pollution_fault"). Kept as text, because a detector in fault is
  // looked at, not automated: which fault it is says whether it is to be cleaned or replaced.
  // https://www.zigbee2mqtt.io/devices/HS1SA-E-PLUS.html
  fault_state: {
    feature: {
      category: DEVICE_FEATURE_CATEGORIES.TEXT,
      type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
    },
  },
  // Mute status of a smoke detector: its siren has been silenced ("alarm_muted",
  // "low_battery_muted"...) instead of being able to ring
  muted: {
    feature: {
      category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SMOKE_SENSOR.MUTED,
      min: 0,
      max: 1,
      forceOverride: true,
    },
    normalValue: NORMAL_VALUE,
  },
};

module.exports = {
  type: 'text',
  writeValue: (expose, value) => {
    return `${value}`;
  },
  readValue: (expose, value) => {
    const { [expose.name]: mapping = {} } = names;

    if (mapping.normalValue !== undefined) {
      return `${value}` === mapping.normalValue ? 0 : 1;
    }

    return `${value}`;
  },
  // Defaults completing the mappings above (an expose with no mapping builds no feature at
  // all): a text feature has no numeric range, but min/max are mandatory on a Gladys feature.
  feature: {
    category: DEVICE_FEATURE_CATEGORIES.TEXT,
    type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
    min: 0,
    max: 0,
  },
  names,
};
