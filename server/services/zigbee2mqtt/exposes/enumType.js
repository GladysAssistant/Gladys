const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  BUTTON_STATUS,
  COVER_STATE,
  SIREN_LMH_VOLUME,
  PILOT_WIRE_MODE,
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
addMapping('action', BUTTON_STATUS.ARM_ALL_ZONES, 'arm_all_zones');

addMapping('action', BUTTON_STATUS.ON_PRESS, 'on-press');
addMapping('action', BUTTON_STATUS.ON_HOLD, 'on-hold');
addMapping('action', BUTTON_STATUS.UP_PRESS, 'up-press');
addMapping('action', BUTTON_STATUS.UP_HOLD, 'up-hold');
addMapping('action', BUTTON_STATUS.DOWN_PRESS, 'down-press');
addMapping('action', BUTTON_STATUS.DOWN_HOLD, 'down-hold');
addMapping('action', BUTTON_STATUS.OFF_PRESS, 'off-press');
addMapping('action', BUTTON_STATUS.OFF_HOLD, 'off-hold');

addMapping('action', BUTTON_STATUS.INITIAL_PRESS, 'initial_press');
addMapping('action', BUTTON_STATUS.LONG_PRESS, 'long_press');
addMapping('action', BUTTON_STATUS.SHORT_RELEASE, 'short_release');
addMapping('action', BUTTON_STATUS.LONG_RELEASE, 'long_release');
addMapping('action', BUTTON_STATUS.DOUBLE_PRESS, 'double_press');

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
