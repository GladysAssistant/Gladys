const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

module.exports = {
  type: 'binary',
  feature: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    min: 0,
    max: 1,
  },
  names: {
    alarm: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SIREN,
        type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
      },
    },
    contact: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
    eco_mode: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
    occupancy: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
    interlock: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
    carbon_monoxide: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
    presence: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
    smoke: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
    state: {
      types: {
        light: {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        },
        lock: {
          category: DEVICE_FEATURE_CATEGORIES.ACCESS_CONTROL,
          type: DEVICE_FEATURE_TYPES.ACCESS_CONTROL.MODE,
        },
        switch: {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
      },
    },
    vibration: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.BINARY,
      },
    },
    water_leak: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
  },
};
