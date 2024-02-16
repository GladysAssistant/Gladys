const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  OPENING_SENSOR_STATE,
  STATE,
} = require('../../../utils/constants');

const CONFIGURATION = {
  ZWAVEJS_UI_MQTT_URL_KEY: 'ZWAVEJS_UI_MQTT_URL',
  ZWAVEJS_UI_MQTT_USERNAME_KEY: 'ZWAVEJS_UI_MQTT_USERNAME',
  ZWAVEJS_UI_MQTT_PASSWORD_KEY: 'ZWAVEJS_UI_MQTT_PASSWORD',
};

const STATES = {
  binary_switch: {
    currentvalue: {
      [STATE.OFF]: false,
      [STATE.ON]: true,
      false: STATE.OFF,
      true: STATE.ON,
    },
  },
  notification: {
    access_control: {
      door_state_simple: {
        22: OPENING_SENSOR_STATE.OPEN,
        23: OPENING_SENSOR_STATE.CLOSE,
      },
    },
  },
};

const COMMANDS = {
  binary_switch: {
    currentvalue: {
      getName: (_nodeFeature) => 'set',
      getArgs: (value, _nodeFeature) => {
        return [STATES.binary_switch.currentvalue[value]];
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
};
