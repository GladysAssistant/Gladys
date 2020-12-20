const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS, DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

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
  this.devices[sid] = data;
  const newSensor = {
    service_id: this.serviceId,
    name: data.module_name,
    selector: `netatmo:${sid}`,
    external_id: `netatmo:${sid}`,
    model: 'netatmo-thermostat',
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    features: [
      {
        name: `Temperature - ${data.module_name}`,
        selector: `netatmo:${sid}:temperature`,
        external_id: `netatmo:${sid}:temperature`,
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -20,
        max: 60,
      },
      {
        name: `Battery - ${data.module_name}`,
        selector: `netatmo:${sid}:battery`,
        external_id: `netatmo:${sid}:battery`,
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
      {
        name: `Setpoint temperature - ${data.module_name}`,
        selector: `netatmo:${sid}:therm_setpoint_temperature`,
        external_id: `netatmo:${sid}:therm_setpoint_temperature`,
        category: DEVICE_FEATURE_CATEGORIES.SETPOINT,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -20,
        max: 60,
      },
      {
        name: `Setpoint mode - ${data.module_name}`,
        selector: `netatmo:${sid}:therm_setpoint_mode`,
        external_id: `netatmo:${sid}:therm_setpoint_mode`,
        category: DEVICE_FEATURE_CATEGORIES.SETPOINT,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -20,
        max: 60,
      },
      {
        name: `Heating power request - ${data.module_name}`,
        selector: `netatmo:${sid}:heating_power_request`,
        external_id: `netatmo:${sid}:heating_power_request`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1,
      },
    ],
    params: [
      {
        name: `Programs Thermostat ${data.module_name}`,
        value: JSON.stringify(this.devices[sid].therm_program_list),
      }
    ]
  };
  this.addSensor(sid, newSensor);
}

module.exports = {
  newValueThermostat,
};
