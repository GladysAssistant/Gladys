const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

// Zigbee "text" exposes carry a free-form string built by the device itself. Most of them are
// diagnostic states saying whether the device is in its normal state, or which of its abnormal
// states are currently raised — the device joins them together ("fault | pollution_fault") — so
// they are mapped to a binary Gladys feature: "normal" is 0, anything else is 1.
// The exact abnormal state stays device-specific and is not modeled.
const NORMAL_VALUE = 'normal';

const names = {
  // Fault status of a smoke detector, e.g. Heiman HS1SA-E-PLUS
  // https://www.zigbee2mqtt.io/devices/HS1SA-E-PLUS.html
  fault_state: {
    feature: {
      category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SMOKE_SENSOR.FAULT,
      min: 0,
      max: 1,
      forceOverride: true,
    },
    normalValue: NORMAL_VALUE,
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
  // A text expose Gladys has no mapping for would be a plain text feature: it has no numeric
  // range, but min/max are mandatory on a Gladys feature.
  feature: {
    category: DEVICE_FEATURE_CATEGORIES.TEXT,
    type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
    min: 0,
    max: 0,
  },
  names,
};
