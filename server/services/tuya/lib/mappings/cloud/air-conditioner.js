const {
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../utils/constants');

module.exports = {
  ignoredCodes: [
    'switch',
    'fan_speed_enum',
    'eco',
    'mode_eco',
    'drying',
    'mode_dry',
    'cleaning',
    'clean',
    'temp_unit_convert',
    'unit',
    'heat',
    'heat8',
    'light',
    'sleep',
    'health',
    'windshake',
    'countdown',
    'countdown_left',
    'use_number',
    'total_time',
    'electricity',
    'electricity_number',
    'type',
    'current_mode',
    'swing3d',
  ],
  power: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
  },
  temp_set: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    scale: 1,
  },
  temp_current: {
    category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    unit: DEVICE_FEATURE_UNITS.CELSIUS,
    scale: 1,
  },
  mode: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
  },
  windspeed: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED,
  },
  horizontal: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_HORIZONTAL,
  },
  vertical: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_VERTICAL,
  },
};
