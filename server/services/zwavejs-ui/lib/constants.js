const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  OPENING_SENSOR_STATE,
  STATE,
  COVER_STATE,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');

const CONFIGURATION = {
  ZWAVEJS_UI_MQTT_URL_KEY: 'ZWAVEJS_UI_MQTT_URL',
  ZWAVEJS_UI_MQTT_USERNAME_KEY: 'ZWAVEJS_UI_MQTT_USERNAME',
  ZWAVEJS_UI_MQTT_PASSWORD_KEY: 'ZWAVEJS_UI_MQTT_PASSWORD',
};

const PARAMS = {
  LOCATION: `location`,
};

const multilevelSwitchCurtainsStateDefault = {
  currentvalue: [
    {
      name: 'position',
      converter: (val) => val,
    },
  ],
};

/**
 * Convert a zWave value format to the
 * Gladys format.
 */
const STATES = {
  binary_switch: {
    currentvalue: (val) => {
      switch (val) {
        case false:
          return STATE.OFF;
        case true:
          return STATE.ON;
        default:
          return null;
      }
    },
  },
  multilevel_sensor: {
    air_temperature: (val) => val,
    power: (val) => val,
  },
  multilevel_switch: {
    currentvalue: [
      {
        name: 'position',
        converter: (val) => val,
      },
      {
        name: 'state',
        converter: (val) => (val > 0 ? STATE.ON : STATE.OFF),
      },
    ],
    '17-5': multilevelSwitchCurtainsStateDefault,
    '17-6': multilevelSwitchCurtainsStateDefault,
    '17-7': multilevelSwitchCurtainsStateDefault,
  },
  notification: {
    access_control: {
      door_state_simple: (val) => {
        switch (val) {
          case 22:
            return OPENING_SENSOR_STATE.OPEN;
          case 23:
            return OPENING_SENSOR_STATE.CLOSE;
          default:
            return null;
        }
      },
    },
  },
};

/**
 * @description Build a command action.
 * @param {string} name - Command name.
 * @param {any[]} value - Value to send to the command.
 * @param {object|null} stateUpdate - State synchronization.
 * @returns {object} Action to perform.
 * @example buildCommandAction('stopLevelChange', []);
 */
function buildCommandAction(name, value, stateUpdate) {
  return {
    isCommand: true,
    name,
    value,
    stateUpdate: stateUpdate || null,
  };
}

/**
 * @description Build a writeValue action.
 * @param {string} property - Property name.
 * @param {any} value - Value to write.
 * @param {object|null} stateUpdate - State synchronization.
 * @returns {object} Action to perform.
 * @example buildWriteValueAction('targetValue', 99, {position: 99})
 */
function buildWriteValueAction(property, value, stateUpdate) {
  return {
    isCommand: false,
    name: property,
    value,
    stateUpdate: stateUpdate || null,
  };
}
const multilevelSwitchCurtainsActionsDefault = {
  currentvalue: {
    state: (value, _nodeContext) => {
      if (value === COVER_STATE.STOP) {
        return buildCommandAction('stopLevelChange', []);
      }

      if (value === COVER_STATE.OPEN) {
        return buildWriteValueAction('targetValue', 0, { position: 0 });
      }

      // COVER_STATE.CLOSE
      return buildWriteValueAction('targetValue', 99, { position: 99 });
    },
    position: (value, _nodeContext) => buildWriteValueAction('targetValue', value),
  },
};
/**
 * Convert value from Gladys format to
 * the Zwave MQTT expected format.
 */
const ACTIONS = {
  binary_switch: {
    currentvalue: (value, _nodeContext) => buildWriteValueAction('targetValue', value === STATE.ON),
  },
  multilevel_switch: {
    currentvalue: {
      state: (value, _nodeContext) => {
        if (value === STATE.ON) {
          // On multilevel switch dimmers, when turning ON, let's go back
          // to the latest value. Same behavior as pushing the real button.
          return buildWriteValueAction('restorePrevious', true);
        }

        return buildWriteValueAction('targetValue', 0, { position: 0 });
      },
      position: (value, _nodeContext) =>
        buildWriteValueAction('targetValue', value, { state: value > 0 ? STATE.ON : STATE.OFF }),
    },
    '17-5': multilevelSwitchCurtainsActionsDefault,
    '17-6': multilevelSwitchCurtainsActionsDefault,
    '17-7': multilevelSwitchCurtainsActionsDefault,
  },
};

/**
 * List of supported features.
 */
const EXPOSES = {
  binary_switch: {
    currentvalue: {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      min: 0,
      max: 1,
      keep_history: true,
      read_only: false,
      has_feedback: false,
    },
  },
  multilevel_sensor: {
    air_temperature: {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      min: -100,
      max: 150,
      keep_history: true,
      read_only: true,
      has_feedback: false,
    },
    power: {
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
      unit: DEVICE_FEATURE_UNITS.WATT,
      min: 0,
      max: 5000,
      keep_history: true,
      read_only: true,
      has_feedback: false,
    },
  },
  multilevel_switch: {
    // Default deviceClass refers to SWITCH
    currentvalue: [
      {
        name: 'position',
        feature: {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          min: 0,
          max: 99,
          keep_history: true,
          read_only: false,
          has_feedback: false,
        },
      },
      {
        name: 'state',
        feature: {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          min: 0,
          max: 1,
          keep_history: true,
          read_only: false,
          has_feedback: false,
        },
      },
    ],
    /// Curtains
    // Class A Motor: Window Covering No Position/Endpoint Device Type
    '17-5': {
      currentvalue: [
        {
          name: 'position',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            min: 0,
            max: 99,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
        {
          name: 'state',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
      ],
    },
    /// Curtains
    // Class B Motor : Window Covering Endpoint Aware Device Type
    '17-6': {
      currentvalue: [
        {
          name: 'position',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            min: 0,
            max: 99,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
        {
          name: 'state',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
      ],
    },
    /// Curtains
    // Class C Motor : Window Covering Position/Endpoint Aware Device Type
    '17-7': {
      currentvalue: [
        {
          name: 'position',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            min: 0,
            max: 99,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
        {
          name: 'state',
          feature: {
            category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
            type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: false,
          },
        },
      ],
    },
  },
  notification: {
    access_control: {
      door_state_simple: {
        category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        min: 0,
        max: 1,
        keep_history: true,
        read_only: true,
        has_feedback: true,
      },
    },
  },
};

module.exports = {
  ACTIONS,
  CONFIGURATION,
  EXPOSES,
  STATES,
  PARAMS,
};
