const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { CUBE_STATUS } = require('../utils/deviceStatus');
const { getBatteryPercent } = require('../utils/getBatteryPercent');
const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description New value thermostat received.
 * @param {Object} message - Message received.
 * @param {Object} data - Data received.
 * @example
 * newValueThermostat(122324, {
 *    voltage: 3000,
 *    status: 1
 * });
 */
function newValueThermostat(data) {
  const sid = data._id;
  logger.debug(`Netatmo : New value thermostat, sid = ${sid}`);
  this.devices[sid] = data;
  const newSensor = {
    service_id: this.serviceId,
    name: `Netatmo Thermostat`,
    selector: `netatmo:${sid}`,
    external_id: `netatmo:${sid}`,
    model: 'netatmo-thermostat',
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    features: [
      {
        name: 'Temperature',
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
        name: 'Battery',
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
        name: 'Setpoint',
        selector: `netatmo:${sid}:setpoint`,
        external_id: `netatmo:${sid}:setpoint`,
        category: DEVICE_FEATURE_CATEGORIES.SETPOINT,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -20,
        max: 60,
      },
    ],
  };
  this.addSensor(sid, newSensor);
}

module.exports = {
  newValueThermostat,
};
