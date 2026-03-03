const {
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../utils/constants');

module.exports = {
  ignoredCodes: [
    'coef_a_reset',
    'coef_b_reset',
    'current_a_calibration',
    'current_b_calibration',
    'direction_a',
    'direction_b',
    'energy_a_calibration_fwd',
    'energy_a_calibration_rev',
    'energy_b_calibration_fwd',
    'energy_b_calibration_rev',
    'freq',
    'freq_calibration',
    'power_a_calibration',
    'power_b_calibration',
    'power_factor',
    'power_factor_b',
    'report_rate_control',
    'tbd',
    'voltage_coef',
  ],
  power_a: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
  },
  power_b: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
  },
  total_power: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
  },
  voltage_a: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
    unit: DEVICE_FEATURE_UNITS.VOLT,
  },
  current_a: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
    unit: DEVICE_FEATURE_UNITS.MILLI_AMPERE,
  },
  current_b: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
    unit: DEVICE_FEATURE_UNITS.MILLI_AMPERE,
  },
  energy_forword_a: {
    // Intentional: matches Tuya device API code.
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  energy_forword_b: {
    // Intentional: matches Tuya device API code.
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  forward_energy_total: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  energy_reverse_a: {
    // Intentional: matches Tuya device API code.
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  energy_reserse_b: {
    // Intentional: matches Tuya device API code.
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  reverse_energy_total: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
};
