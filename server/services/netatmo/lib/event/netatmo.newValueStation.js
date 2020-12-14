const logger = require('../../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

/**
 * @description New value thermostat received.
 * @param {Object} data - Data received.
 * @example
 * newValueThermostat(122324, {
 * });
 */
function newValueStation(data) {
  /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
  const sid = data._id;
  logger.debug(`Netatmo : New value stations, sid = ${sid}`);
  this.devices[sid] = data;
  const newSensor = {
    service_id: this.serviceId,
    name: `Netatmo Station`,
    selector: `netatmo:${sid}`,
    external_id: `netatmo:${sid}`,
    model: 'netatmo-station',
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
        name: 'Humidity',
        selector: `netatmo:${sid}:humidity`,
        external_id: `netatmo:${sid}:humidity`,
        category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
      {
        name: 'CO2',
        selector: `netatmo:${sid}:co2`,
        external_id: `netatmo:${sid}:co2`,
        category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1000,
      },
      {
        name: 'Pressure',
        selector: `netatmo:${sid}:pressure`,
        external_id: `netatmo:${sid}:pressure`,
        category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PASCAL,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 3000,
        max: 11000,
      }
    ],
  };
  this.addSensor(sid, newSensor);
}

module.exports = {
  newValueStation,
};
