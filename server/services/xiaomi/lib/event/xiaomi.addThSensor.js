const logger = require('../../../../utils/logger');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @example
 * addThSensor(true);
 */
async function addThSensor(sid) {
  logger.debug(`Xiaomi : set RAM variable`);

  this.sensor[sid] = {
    service_id: this.serviceId,
    name: `xiaomi-${sid}-sensor-temp-hum-pression`,
    external_id: `${sid}`,
    should_poll: false,
    features: [
      {
        name: `xiaomi-${sid}-battery`,
        external_id: `xiaomi-${sid}-decimal-battery`,
        category: 'battery',
        type: 'decimal',
        unit: '%',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 100,
      },
      {
        name: `xiaomi-${sid}-temperature`,
        external_id: `xiaomi-${sid}-decimal-temperature`,
        category: 'temperature-sensor',
        type: 'decimal',
        unit: 'celsius',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: -20,
        max: 100,
      },
      {
        name: `xiaomi-${sid}-humidity`,
        external_id: `xiaomi-${sid}-decimal-humidity`,
        category: 'humidity-sensor',
        type: 'decimal',
        unit: '%',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 100,
      },
    ],
  };
}

module.exports = {
  addThSensor,
};
