const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Transforms Tessie feature as Gladys feature.
 * @param {string} externalId - Gladys external ID.
 * @param {string} category - Gladys category.
 * @param {number} batteryCapacity - Battery capacity.
 * @param {number} batteryRangeMax - Battery range max.
 * @param {object} chargeState - Charge state from Tessie.
 * @param {object} driveState - Drive state from Tessie.
 * @returns {object} Gladys feature or undefined.
 * @example
 * buildFeatureBattery('tessie:vehicle_vin', 'ELECTRICAL_VEHICLE_BATTERY', batteryCapacity, batteryRangeMax, chargeState, driveState);
 */
function buildFeatureBattery(externalId, category, batteryCapacity, batteryRangeMax, chargeState, driveState) {
  return [
    {
      name: 'Battery Level',
      external_id: `${externalId}:battery_level`,
      selector: `${externalId}-battery-level`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].BATTERY_LEVEL,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 100,
      last_value: chargeState?.usable_battery_level || chargeState?.battery_level,
    },
    {
      name: 'Battery energy remaining',
      external_id: `${externalId}:battery_energy_remaining`,
      selector: `${externalId}-battery-energy-remaining`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].BATTERY_ENERGY_REMAINING,
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: batteryCapacity,
      last_value: chargeState?.energy_remaining,
    },
    {
      name: 'Battery range estimate',
      external_id: `${externalId}:battery_range_estimate`,
      selector: `${externalId}-battery-range-estimate`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].BATTERY_RANGE_ESTIMATE,
      unit: DEVICE_FEATURE_UNITS.MILE,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: batteryRangeMax,
      last_value: chargeState?.battery_range,
    },
    {
      name: 'Battery power',
      external_id: `${externalId}:battery_power`,
      selector: `${externalId}-battery-power`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].BATTERY_POWER,
      unit: DEVICE_FEATURE_UNITS.KILOWATT,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 10000,
      last_value: driveState?.power,
    },
    {
      name: 'Battery temperature min',
      external_id: `${externalId}:battery_temperature_min`,
      selector: `${externalId}-battery-temperature-min`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].BATTERY_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: -50,
      max: 100,
      last_value: chargeState?.module_temp_min,
    },
    {
      name: 'Battery temperature max',
      external_id: `${externalId}:battery_temperature_max`,
      selector: `${externalId}-battery-temperature-max`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].BATTERY_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: -50,
      max: 100,
      last_value: chargeState?.module_temp_max,
    },
    {
      name: 'Battery voltage',
      external_id: `${externalId}:battery_voltage`,
      selector: `${externalId}-battery-voltage`,
      category: DEVICE_FEATURE_CATEGORIES[category],
      type: DEVICE_FEATURE_TYPES[category].BATTERY_VOLTAGE,
      unit: DEVICE_FEATURE_UNITS.VOLT,
      read_only: true,
      has_feedback: false,
      keep_history: true,
      min: 0,
      max: 1000,
      last_value: chargeState?.pack_voltage,
    },
  ];
}

module.exports = {
  buildFeatureBattery,
};
