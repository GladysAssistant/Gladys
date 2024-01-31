const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, OPENING_SENSOR_STATE } = require('../../../utils/constants');

const CONFIGURATION = {
  ZWAVEJS_UI_MQTT_URL_KEY: 'ZWAVEJS_UI_MQTT_URL',
  ZWAVEJS_UI_MQTT_USERNAME_KEY: 'ZWAVEJS_UI_MQTT_USERNAME',
  ZWAVEJS_UI_MQTT_PASSWORD_KEY: 'ZWAVEJS_UI_MQTT_PASSWORD',
};

const EXPOSES = {
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

const STATES = {
  notification: {
    access_control: {
      door_state_simple: {
        22: OPENING_SENSOR_STATE.OPEN,
        23: OPENING_SENSOR_STATE.CLOSE,
      },
    },
  },
};

module.exports = {
  CONFIGURATION,
  EXPOSES,
  STATES,
};
