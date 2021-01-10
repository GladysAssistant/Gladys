const logger = require('../../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description New value valve received.
 * @param {Object} data - Data received.
 * @example
 * newValueValve(122324, {
 * });
 */
function newValueValve(data) {
  const sid = data.id;
  let newValve;
  logger.debug(`Netatmo : New valve, sid = ${sid}`);
  this.devices[sid] = data;
  // we create the valve device
  if (data.type === 'NRV') {
    newValve = {
      name: data.name,
      should_poll: false,
      external_id: `netatmo:${sid}`,
      selector: `netatmo:${sid}`,
      service_id: this.serviceId,
      model: `netatmo-${data.type}`,
      features: [
        {
          name: `Temperature - ${data.name}`,
          selector: `netatmo:${sid}:temperature`,
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
          selector: `netatmo:${sid}:battery`,
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
          selector: `netatmo:${sid}:therm_setpoint_temperature`,
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
          name: `Setpoint mode - ${data.name}`,
          selector: `netatmo:${sid}:therm_setpoint_mode`,
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
          name: `Heating power request - ${data.name}`,
          selector: `netatmo:${sid}:heating_power_request`,
          external_id: `netatmo:${sid}:heating_power_request`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
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
          name: 'Room_id_valve',
          value: data.room_id,
        },
      ],
    };
  }
  this.addSensor(sid, newValve);
}

module.exports = {
  newValueValve,
};
