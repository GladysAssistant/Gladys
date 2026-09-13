const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

// A Zigbee "text" expose carries a free-form string: the device builds it itself, and no
// generic Gladys value set can describe it. They are mapped to text features, whose state is
// stored as a string (last_value_string).
const names = {
  // Fault status of a smoke/CO detector: "normal", or the faults currently raised joined
  // together ("fault | pollution_fault"), e.g. Heiman HS1SA-E-PLUS
  // https://www.zigbee2mqtt.io/devices/HS1SA-E-PLUS.html
  fault_state: {
    feature: {
      category: DEVICE_FEATURE_CATEGORIES.TEXT,
      type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
    },
  },
  // Mute status of a detector: "normal", or the alarms currently silenced joined together
  // ("alarm_muted | low_battery_muted")
  muted: {
    feature: {
      category: DEVICE_FEATURE_CATEGORIES.TEXT,
      type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
    },
  },
};

module.exports = {
  type: 'text',
  writeValue: (expose, value) => {
    return `${value}`;
  },
  readValue: (expose, value) => {
    return `${value}`;
  },
  feature: {
    category: DEVICE_FEATURE_CATEGORIES.TEXT,
    type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
    // A text feature has no numeric range, but min/max are mandatory on a Gladys feature
    min: 0,
    max: 0,
  },
  names,
};
