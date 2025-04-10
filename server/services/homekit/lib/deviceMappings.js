const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, COVER_STATE } = require('../../../utils/constants');

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
  [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: {
    service: 'MotionSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['MotionDetected'],
        notifDelay: 1000,
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR]: {
    service: 'LeakSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['LeakDetected'],
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
  [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: {
    service: 'HumiditySensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['CurrentRelativeHumidity'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SHUTTER]: {
    service: 'WindowCovering',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SHUTTER.POSITION]: {
        characteristics: ['CurrentPosition', 'TargetPosition'],
      },
      [DEVICE_FEATURE_TYPES.SHUTTER.STATE]: {
        characteristics: ['PositionState'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CURTAIN]: {
    service: 'WindowCovering',
    capabilities: {
      [DEVICE_FEATURE_TYPES.CURTAIN.POSITION]: {
        characteristics: ['CurrentPosition', 'TargetPosition'],
      },
      [DEVICE_FEATURE_TYPES.CURTAIN.STATE]: {
        characteristics: ['PositionState'],
      },
    },
  },
};

const coverStateMapping = {
  [COVER_STATE.CLOSE]: 0,
  [COVER_STATE.OPEN]: 1,
  [COVER_STATE.STOP]: 2,
};

module.exports = { mappings, coverStateMapping };
