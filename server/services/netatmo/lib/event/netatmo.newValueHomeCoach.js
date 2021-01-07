const logger = require('../../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description New value homecoachs received.
 * @param {Object} data - Data received.
 * @example
 * newValueHomeCoach(122324, {
 * });
 */
function newValueHomeCoach(data) {
  /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
  const sid = data._id;
  logger.debug(`Netatmo : New homecoach, sid = ${sid}`);
  this.devices[sid] = data;
  const newSensor = {
    service_id: this.serviceId,
    name: data.station_name,
    selector: `netatmo:${sid}`,
    external_id: `netatmo:${sid}`,
    model: 'netatmo-home-coachs',
    should_poll: false,
    features: [
      {
        name: `Temperature - ${data.station_name}`,
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
        name: `Humidity - ${data.station_name}`,
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
        name: `CO2 - ${data.station_name}`,
        selector: `netatmo:${sid}:co2`,
        external_id: `netatmo:${sid}:co2`,
        category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PPM,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1000,
      },
      {
        name: `Pressure - ${data.station_name}`,
        selector: `netatmo:${sid}:pressure`,
        external_id: `netatmo:${sid}:pressure`,
        category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.MILLIBAR,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 5000,
      },
      {
        name: `Pressure absolue - ${data.station_name}`,
        selector: `netatmo:${sid}:absolutePressure`,
        external_id: `netatmo:${sid}:absolutePressure`,
        category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.MILLIBAR,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 5000,
      },
      {
        name: `Noise - ${data.station_name}`,
        selector: `netatmo:${sid}:noise`,
        external_id: `netatmo:${sid}:noise`,
        category: DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.DECIBEL,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 150,
      },
      {
        name: `Health index - ${data.station_name}`,
        selector: `netatmo:${sid}:health_idx`,
        external_id: `netatmo:${sid}:health_idx`,
        category: DEVICE_FEATURE_CATEGORIES.INDEX,
        type: DEVICE_FEATURE_TYPES.INDEX.DIMMER,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 4,
      },
      {
        name: `Reachable (WiFi or Power) - ${data.station_name}`,
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
  };
  this.addSensor(sid, newSensor);
}

module.exports = {
  newValueHomeCoach,
};
