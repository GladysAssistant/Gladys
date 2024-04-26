const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  OPENING_SENSOR_STATE,
  STATE,
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
 * Convert value from Gladys format to
 * the Zwave MQTT expected format.
 */
const COMMANDS = {
  binary_switch: {
    currentvalue: {
      getName: (_nodeFeature) => 'set',
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
};

const EXPOSES = {
  binary_switch: {
    currentvalue: {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      min: 0,
      max: 1,
      keep_history: true,
      read_only: false,
      has_feedback: true,
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
