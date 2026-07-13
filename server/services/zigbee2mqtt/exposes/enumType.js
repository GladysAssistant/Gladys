const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  BUTTON_STATUS,
  BUTTON_PUSH,
  COVER_STATE,
  SIREN_LMH_VOLUME,
  PILOT_WIRE_MODE,
  LIQUID_STATE,
} = require('../../../utils/constants');

const WRITE_VALUE_MAPPING = {};
const READ_VALUE_MAPPING = {};

const addMapping = (exposeName, gladysValue, z2mValue) => {
  const writeExposeMapping = WRITE_VALUE_MAPPING[exposeName] || {};
  writeExposeMapping[gladysValue] = z2mValue;
  WRITE_VALUE_MAPPING[exposeName] = writeExposeMapping;

  const readExposeMapping = READ_VALUE_MAPPING[exposeName] || {};
  readExposeMapping[z2mValue] = gladysValue;
  READ_VALUE_MAPPING[exposeName] = readExposeMapping;
};

addMapping('action', BUTTON_STATUS.CLICK, 'single');
addMapping('action', BUTTON_STATUS.DOUBLE_CLICK, 'double');
addMapping('action', BUTTON_STATUS.HOLD_CLICK, 'hold');
addMapping('action', BUTTON_STATUS.LONG_CLICK, 'long');

addMapping('action', BUTTON_STATUS.ON, 'on');
addMapping('action', BUTTON_STATUS.OFF, 'off');
addMapping('action', BUTTON_STATUS.ON_DOUBLE, 'on_double');
addMapping('action', BUTTON_STATUS.OFF_DOUBLE, 'off_double');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_MOVE_DOWN, 'brightness_move_down');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_MOVE_UP, 'brightness_move_up');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_STOP, 'brightness_stop');

addMapping('action', BUTTON_STATUS.ARROW_LEFT_CLICK, 'arrow_left_click');
addMapping('action', BUTTON_STATUS.ARROW_RIGHT_CLICK, 'arrow_right_click');
addMapping('action', BUTTON_STATUS.ARROW_LEFT_HOLD, 'arrow_left_hold');
addMapping('action', BUTTON_STATUS.ARROW_RIGHT_HOLD, 'arrow_right_hold');
addMapping('action', BUTTON_STATUS.ARROW_LEFT_RELEASE, 'arrow_left_release');
addMapping('action', BUTTON_STATUS.ARROW_RIGHT_RELEASE, 'arrow_right_release');

addMapping('action', BUTTON_STATUS.TRIPLE, 'triple');
addMapping('action', BUTTON_STATUS.QUADRUPLE, 'quadruple');
addMapping('action', BUTTON_STATUS.RELEASE, 'release');
addMapping('action', BUTTON_STATUS.MANY, 'many');

addMapping('action', BUTTON_STATUS.SHAKE, 'shake');
addMapping('action', BUTTON_STATUS.THROW, 'throw');
addMapping('action', BUTTON_STATUS.WAKEUP, 'wakeup');
addMapping('action', BUTTON_STATUS.FALL, 'fall');
addMapping('action', BUTTON_STATUS.TAP, 'tap');
addMapping('action', BUTTON_STATUS.SLIDE, 'slide');
addMapping('action', BUTTON_STATUS.FLIP_180, 'flip180');
addMapping('action', BUTTON_STATUS.FLIP_90, 'flip90');
addMapping('action', BUTTON_STATUS.ROTATE_LEFT, 'rotate_left');
addMapping('action', BUTTON_STATUS.ROTATE_RIGHT, 'rotate_right');

addMapping('action', BUTTON_STATUS.VIBRATION, 'vibration');
addMapping('action', BUTTON_STATUS.TILT, 'tilt');
addMapping('action', BUTTON_STATUS.DROP, 'drop');

addMapping('action', BUTTON_STATUS.EMERGENCY, 'emergency');
addMapping('action', BUTTON_STATUS.DISARM, 'disarm');
addMapping('action', BUTTON_STATUS.ARM_DAY_ZONES, 'arm_day_zones');
addMapping('action', BUTTON_STATUS.ARM_NIGHT_ZONES, 'arm_night_zones');
addMapping('action', BUTTON_STATUS.ARM_ALL_ZONES, 'arm_all_zones');
addMapping('action', BUTTON_STATUS.EXIT_DELAY, 'exit_delay');

addMapping('action', BUTTON_STATUS.ON_PRESS, 'on-press');
addMapping('action', BUTTON_STATUS.ON_HOLD, 'on-hold');
addMapping('action', BUTTON_STATUS.UP_PRESS, 'up-press');
addMapping('action', BUTTON_STATUS.UP_HOLD, 'up-hold');
addMapping('action', BUTTON_STATUS.DOWN_PRESS, 'down-press');
addMapping('action', BUTTON_STATUS.DOWN_HOLD, 'down-hold');
addMapping('action', BUTTON_STATUS.OFF_PRESS, 'off-press');
addMapping('action', BUTTON_STATUS.OFF_HOLD, 'off-hold');

// For Philips Hue Dimmer Switch v2
// https://www.zigbee2mqtt.io/devices/929002398602.html
addMapping('action', BUTTON_STATUS.ON_PRESS, 'on_press');
addMapping('action', BUTTON_STATUS.ON_HOLD, 'on_hold');
addMapping('action', BUTTON_STATUS.UP_PRESS, 'up_press');
addMapping('action', BUTTON_STATUS.UP_HOLD, 'up_hold');
addMapping('action', BUTTON_STATUS.DOWN_PRESS, 'down_press');
addMapping('action', BUTTON_STATUS.DOWN_HOLD, 'down_hold');
addMapping('action', BUTTON_STATUS.OFF_PRESS, 'off_press');
addMapping('action', BUTTON_STATUS.OFF_HOLD, 'off_hold');

addMapping('action', BUTTON_STATUS.INITIAL_PRESS, 'initial_press');
addMapping('action', BUTTON_STATUS.LONG_PRESS, 'long_press');
addMapping('action', BUTTON_STATUS.SHORT_RELEASE, 'short_release');
addMapping('action', BUTTON_STATUS.LONG_RELEASE, 'long_release');
addMapping('action', BUTTON_STATUS.DOUBLE_PRESS, 'double_press');

addMapping('action', BUTTON_STATUS.TOGGLE, 'toggle');
addMapping('action', BUTTON_STATUS.TOGGLE_HOLD, 'toggle_hold');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_UP_CLICK, 'brightness_up_click');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_UP_HOLD, 'brightness_up_hold');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_UP_RELEASE, 'brightness_up_release');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_DOWN_CLICK, 'brightness_down_click');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_DOWN_HOLD, 'brightness_down_hold');
addMapping('action', BUTTON_STATUS.BRIGHTNESS_DOWN_RELEASE, 'brightness_down_release');

addMapping('action', BUTTON_STATUS.PRESSED, 'pressed');

addMapping('action', BUTTON_STATUS.SINGLE_LEFT, 'single_left');
addMapping('action', BUTTON_STATUS.SINGLE_RIGHT, 'single_right');
addMapping('action', BUTTON_STATUS.SINGLE_BOTH, 'single_both');
addMapping('action', BUTTON_STATUS.DOUBLE_LEFT, 'double_left');
addMapping('action', BUTTON_STATUS.DOUBLE_RIGHT, 'double_right');
addMapping('action', BUTTON_STATUS.DOUBLE_BOTH, 'double_both');
addMapping('action', BUTTON_STATUS.TRIPLE_LEFT, 'triple_left');
addMapping('action', BUTTON_STATUS.TRIPLE_RIGHT, 'triple_right');
addMapping('action', BUTTON_STATUS.TRIPLE_BOTH, 'triple_both');
addMapping('action', BUTTON_STATUS.HOLD_LEFT, 'hold_left');
addMapping('action', BUTTON_STATUS.HOLD_RIGHT, 'hold_right');
addMapping('action', BUTTON_STATUS.HOLD_BOTH, 'hold_both');

// Add mappings for Aqara W100 temperature
addMapping('action', BUTTON_STATUS.SINGLE_PLUS, 'single_plus');
addMapping('action', BUTTON_STATUS.SINGLE_CENTER, 'single_center');
addMapping('action', BUTTON_STATUS.SINGLE_MINUS, 'single_minus');
addMapping('action', BUTTON_STATUS.DOUBLE_PLUS, 'double_plus');
addMapping('action', BUTTON_STATUS.DOUBLE_CENTER, 'double_center');
addMapping('action', BUTTON_STATUS.DOUBLE_MINUS, 'double_minus');
addMapping('action', BUTTON_STATUS.HOLD_PLUS, 'hold_plus');
addMapping('action', BUTTON_STATUS.HOLD_CENTER, 'hold_center');
addMapping('action', BUTTON_STATUS.HOLD_MINUS, 'hold_minus');
addMapping('action', BUTTON_STATUS.RELEASE_PLUS, 'release_plus');
addMapping('action', BUTTON_STATUS.RELEASE_CENTER, 'release_center');
addMapping('action', BUTTON_STATUS.RELEASE_MINUS, 'release_minus');

// SONOFF SNZB-01M 4-button remote
// https://www.zigbee2mqtt.io/devices/SNZB-01M.html
addMapping('action', BUTTON_STATUS.SINGLE_BUTTON_1, 'single_button_1');
addMapping('action', BUTTON_STATUS.DOUBLE_BUTTON_1, 'double_button_1');
addMapping('action', BUTTON_STATUS.LONG_BUTTON_1, 'long_button_1');
addMapping('action', BUTTON_STATUS.TRIPLE_BUTTON_1, 'triple_button_1');
addMapping('action', BUTTON_STATUS.SINGLE_BUTTON_2, 'single_button_2');
addMapping('action', BUTTON_STATUS.DOUBLE_BUTTON_2, 'double_button_2');
addMapping('action', BUTTON_STATUS.LONG_BUTTON_2, 'long_button_2');
addMapping('action', BUTTON_STATUS.TRIPLE_BUTTON_2, 'triple_button_2');
addMapping('action', BUTTON_STATUS.SINGLE_BUTTON_3, 'single_button_3');
addMapping('action', BUTTON_STATUS.DOUBLE_BUTTON_3, 'double_button_3');
addMapping('action', BUTTON_STATUS.LONG_BUTTON_3, 'long_button_3');
addMapping('action', BUTTON_STATUS.TRIPLE_BUTTON_3, 'triple_button_3');
addMapping('action', BUTTON_STATUS.SINGLE_BUTTON_4, 'single_button_4');
addMapping('action', BUTTON_STATUS.DOUBLE_BUTTON_4, 'double_button_4');
addMapping('action', BUTTON_STATUS.LONG_BUTTON_4, 'long_button_4');
addMapping('action', BUTTON_STATUS.TRIPLE_BUTTON_4, 'triple_button_4');

addMapping('state', COVER_STATE.OPEN, 'OPEN');
addMapping('state', COVER_STATE.CLOSE, 'CLOSE');
addMapping('state', COVER_STATE.STOP, 'STOP');

addMapping('volume', SIREN_LMH_VOLUME.LOW, 'low');
addMapping('volume', SIREN_LMH_VOLUME.MEDIUM, 'medium');
addMapping('volume', SIREN_LMH_VOLUME.HIGH, 'high');

addMapping('pilot_wire_mode', PILOT_WIRE_MODE.COMFORT, 'comfort');
addMapping('pilot_wire_mode', PILOT_WIRE_MODE.ECO, 'eco');
addMapping('pilot_wire_mode', PILOT_WIRE_MODE.FROST_PROTECTION, 'frost_protection');
addMapping('pilot_wire_mode', PILOT_WIRE_MODE.OFF, 'off');
addMapping('pilot_wire_mode', PILOT_WIRE_MODE.COMFORT_1, 'comfort_-1');
addMapping('pilot_wire_mode', PILOT_WIRE_MODE.COMFORT_2, 'comfort_-2');

addMapping('liquid_state', LIQUID_STATE.LOW, 'low');
addMapping('liquid_state', LIQUID_STATE.NORMAL, 'normal');
addMapping('liquid_state', LIQUID_STATE.HIGH, 'high');

// Bosch BSIR-EZ outdoor siren
// https://www.zigbee2mqtt.io/devices/BSIR-EZ.html
addMapping('trigger_alarm', BUTTON_PUSH.PRESSED, 'trigger');
addMapping('stop_alarm', BUTTON_PUSH.PRESSED, 'stop');

module.exports = {
  type: 'enum',
  writeValue: (expose, value) => {
    if (expose.name === 'melody') {
      return value;
    }

    const relatedValue = (WRITE_VALUE_MAPPING[expose.name] || {})[value];

    if (relatedValue && expose.values.includes(relatedValue)) {
      return relatedValue;
    }

    return undefined;
  },
  readValue: (expose, value) => {
    if (expose.name === 'melody') {
      const intValue = parseInt(value, 10);
      return intValue;
    }

    const subValue = value.replace(/^(\d+_)?/, '');
    return (READ_VALUE_MAPPING[expose.name] || {})[subValue];
  },
  feature: {
    min: 0,
    max: 1,
  },
  names: {
    action: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      },
    },
    state: {
      types: {
        cover: {
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
          min: -1,
          max: 1,
          forceOverride: true,
        },
      },
    },
    volume: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SIREN,
        type: DEVICE_FEATURE_TYPES.SIREN.LMH_VOLUME,
      },
    },
    melody: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SIREN,
        type: DEVICE_FEATURE_TYPES.SIREN.MELODY,
      },
    },
    pilot_wire_mode: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.HEATER,
        type: DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE,
      },
    },
    liquid_state: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LEVEL_SENSOR,
        type: DEVICE_FEATURE_TYPES.LEVEL_SENSOR.LIQUID_STATE,
      },
    },
    trigger_alarm: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.PUSH,
      },
    },
    stop_alarm: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.PUSH,
      },
    },
  },
  getFeatureIndexes: (values = []) => {
    const indexes = values
      // Force String value
      .map((value) => `${value}`)
      // Split at first '_' char
      .map((value) => value.split('_', 2))
      // Check for multiple indexes
      .filter((value) => value.length > 1)
      // Map first match to int
      .map((value) => parseInt(value[0], 10))
      // Check if it is an index
      .filter((value) => !Number.isNaN(value));

    return Array.from(new Set(indexes));
  },
};
