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

const multilevelSwitchCurtainsCommandDefault = {
  currentvalue: {
    state: {
      getName: (value, _nodeFeature) => {
        switch (value) {
          case COVER_STATE.STOP:
            return 'stopLevelChange';
          default:
            return 'set';
        }
      },
      getArgs: (value, _nodeFeature) => {
        switch (value) {
          case COVER_STATE.OPEN:
            return [0];
          case COVER_STATE.CLOSE:
            return [99];
          default:
            return [];
        }
      },
      getStateUpdate: (value, _nodeFeature) => {
        switch (value) {
          case COVER_STATE.OPEN:
            return { name: 'position', value: 0 };
          case COVER_STATE.CLOSE:
            return { name: 'position', value: 99 };
          default:
            return null; // On explicit stopLevelChange, the device will send the new currentValue
        }
      },
    },
    position: {
      getName: (_value, _nodeFeature) => 'set',
      getArgs: (value, _nodeFeature) => [value],
    },
  },
};
/**
 * Convert value from Gladys format to
 * the Zwave MQTT expected format.
 */
const COMMANDS = {
  binary_switch: {
    currentvalue: {
      getName: (_value, _nodeFeature) => 'set',
      getArgs: (value, _nodeFeature) => {
        switch (value) {
          case STATE.OFF:
            return [false];
          case STATE.ON:
            return [true];
          default:
            return null;
        }
      },
    },
  },
  multilevel_switch: {
    currentvalue: {
      state: {
        getName: (_value, _nodeFeature) => 'set',
        getArgs: (value, _nodeFeature) => {
          if (value === STATE.ON) {
            return [99];
          }

          return [0];
        },
        getStateUpdate: (value, _nodeFeature) => {
          if (value === STATE.ON) {
            return { name: 'position', value: 99 };
          }

          return { name: 'position', value: 0 };
        },
      },
      position: {
        getName: (_value, _nodeFeature) => 'set',
        getArgs: (value, _nodeFeature) => [value],
        getStateUpdate: (value, _nodeFeature) => {
          return {
            name: 'state',
            value: value > 0 ? STATE.ON : STATE.OFF,
          };
        },
      },
    },
    '17-5': multilevelSwitchCurtainsCommandDefault,
    '17-6': multilevelSwitchCurtainsCommandDefault,
    '17-7': multilevelSwitchCurtainsCommandDefault,
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
  COMMANDS,
  CONFIGURATION,
  EXPOSES,
  STATES,
  PARAMS,
};
