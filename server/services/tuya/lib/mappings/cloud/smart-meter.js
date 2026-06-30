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
    name: 'Power A',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
  },
  power_b: {
    name: 'Power B',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
  },
  total_power: {
    name: 'Total power',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
  },
  voltage_a: {
    name: 'Voltage A',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
    unit: DEVICE_FEATURE_UNITS.VOLT,
  },
  current_a: {
    name: 'Current A',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
    unit: DEVICE_FEATURE_UNITS.MILLI_AMPERE,
  },
  current_b: {
    name: 'Current B',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
    unit: DEVICE_FEATURE_UNITS.MILLI_AMPERE,
  },
  energy_forword_a: {
    // Tuya code carries a typo ("forword"); kept as the API key but the
    // user-facing name is corrected to "Forward energy A".
    name: 'Forward energy A',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  energy_forword_b: {
    // Tuya code carries a typo ("forword"); kept as the API key but the
    // user-facing name is corrected to "Forward energy B".
    name: 'Forward energy B',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  forward_energy_total: {
    name: 'Forward energy total',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  energy_reverse_a: {
    // Reverse energy = energy injected back to the grid (production), hence
    // the ENERGY_PRODUCTION_SENSOR category rather than ENERGY_SENSOR.
    name: 'Reverse energy A',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  energy_reserse_b: {
    // Tuya code carries a typo ("reserse"); kept as the API key but the
    // user-facing name is corrected to "Reverse energy B".
    name: 'Reverse energy B',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  reverse_energy_total: {
    name: 'Reverse energy total',
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
};
