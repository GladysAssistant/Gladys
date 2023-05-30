const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const mappings = {
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    service: 'Lightbulb',
    capabilities: {
      [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: {
        characteristics: ['On'],
      },
      [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: {
        characteristics: ['Brightness'],
      },
      [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: {
        characteristics: ['Hue', 'Saturation'],
      },
      [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: {
        characteristics: ['ColorTemperature'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    service: 'ContactSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['ContactSensorState'],
        notifDelay: 1000,
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    service: 'Switch',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: {
        characteristics: ['On'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    service: 'TemperatureSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['CurrentTemperature'],
      },
    },
  },
};

module.exports = { mappings };
