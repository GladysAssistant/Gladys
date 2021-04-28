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
  const sid = data.id;
  if (data.type === 'NATherm1') {
    logger.debug(`Netatmo : New value thermostat, sid = ${sid} - ${data.type}`);
    const newSensor = {
      service_id: this.serviceId,
      name: data.name,
      selector: `netatmo-${sid}`,
      external_id: `netatmo:${sid}`,
      model: `netatmo-${data.type}`,
      should_poll: false,
      features: [
        {
          name: `Temperature - ${data.name}`,
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
          name: `Battery - ${data.name}`,
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
          name: `Setpoint temperature - ${data.name}`,
          selector: `netatmo-${sid}-therm-setpoint-temperature`,
          external_id: `netatmo:${sid}:therm_setpoint_temperature`,
          category: DEVICE_FEATURE_CATEGORIES.SETPOINT,
          type: DEVICE_FEATURE_TYPES.SETPOINT.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: false,
          keep_history: true,
          has_feedback: true,
          min: 5,
          max: 30,
        },
        {
          name: `Setpoint mode - ${data.name}`,
          selector: `netatmo-${sid}-therm-setpoint-mode`,
          external_id: `netatmo:${sid}:therm_setpoint_mode`,
          category: DEVICE_FEATURE_CATEGORIES.SETPOINT,
          type: DEVICE_FEATURE_TYPES.SETPOINT.STRING,
          read_only: false,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 10,
        },
        {
          name: `Heating power request - ${data.name}`,
          selector: `netatmo-${sid}-heating-power-request`,
          external_id: `netatmo:${sid}:heating_power_request`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.INTEGER,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100,
        },
        {
          name: `Reachable (WiFi or Power) - ${data.name}`,
          selector: `netatmo:${sid}:reachable`,
          external_id: `netatmo:${sid}:reachable`,
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
          name: 'House_Room_id',
          value: `${data.house_id}:${data.room_id}`,
        },
        {
          name: 'NAPLUG',
          value: `${data.bridge}`,
        },
        {
          name: `Programs Thermostat ${data.name}`,
          value: JSON.stringify(data.fullData.therm_program_list),
        },
      ],
    };
    this.addSensor(sid, newSensor);
  } else {
    logger.info(`Files newValueThermostat - Device type unknown : ${data.type}`);
  }
}

module.exports = {
  newValueThermostat,
};
