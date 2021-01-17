const logger = require('../../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description New value thermostat received.
 * @param {Object} data - Data received.
 * @example
 * newValueThermostat(122324, {
 * });
 */
function newValueThermostat(data) {
  /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
  const sid = data._id;
  logger.debug(`Netatmo : New value thermostat, sid = ${sid}`);
  const newSensor = {
    service_id: this.serviceId,
    name: data.module_name,
    selector: `netatmo-${sid}`,
    external_id: `netatmo:${sid}`,
    model: 'netatmo-thermostat',
    should_poll: false,
    features: [
      {
        name: `Temperature - ${data.module_name}`,
        selector: `netatmo-${sid}-temperature`,
        external_id: `netatmo:${sid}:temperature`,
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 50,
      },
      {
        name: `Battery - ${data.module_name}`,
        selector: `netatmo-${sid}-battery`,
        external_id: `netatmo:${sid}:battery`,
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
      {
        name: `Setpoint temperature - ${data.module_name}`,
        selector: `netatmo-${sid}-therm-setpoint-temperature`,
        external_id: `netatmo:${sid}:therm_setpoint_temperature`,
        category: DEVICE_FEATURE_CATEGORIES.SETPOINT,
        type: DEVICE_FEATURE_TYPES.SETPOINT.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 5,
        max: 30,
      },
      {
        name: `Setpoint mode - ${data.module_name}`,
        selector: `netatmo-${sid}-therm-setpoint-mode`,
        external_id: `netatmo:${sid}:therm_setpoint_mode`,
        category: DEVICE_FEATURE_CATEGORIES.SETPOINT,
        type: DEVICE_FEATURE_TYPES.SETPOINT.STRING,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 10,
      },
      {
        name: `Heating power request - ${data.module_name}`,
        selector: `netatmo-${sid}-heating-power-request`,
        external_id: `netatmo:${sid}:heating_power_request`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
    ],
    params: [
      {
        name: `Programs Thermostat ${data.module_name}`,
        value: JSON.stringify(data.therm_program_list),
      },
    ],
  };
  this.addSensor(sid, newSensor);
}

module.exports = {
  newValueThermostat,
};
