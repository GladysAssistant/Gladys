const logger = require('../../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

/**
 * @description New value smoke detector received.
 * @param {Object} data - Data received.
 * @example
 * newValueSmokeDetector(122324, {
 * });
 */
function newValueSmokeDetector(data) {
  /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
  const sid = data.id;
  logger.debug(`Netatmo : New Smoke Detector, sid = ${sid}`);
  this.devices[sid] = data;
  
  const newSensor = {
    service_id: this.serviceId,
    name: data.name,
    selector: `netatmo:${sid}`,
    external_id: `netatmo:${sid}`,
    model: 'netatmo-smokeDetector',
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    features: [
      {
        name: `Détection de fumée - ${data.name}`,
        selector: `netatmo:${sid}:smokeDetector`,
        external_id: `netatmo:${sid}:smokeDetector`,
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: `Battery - ${data.name}`,
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
    ],
  };
  this.addSensor(sid, newSensor);
}

module.exports = {
  newValueSmokeDetector,
};
