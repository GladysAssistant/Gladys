const logger = require('../../../../utils/logger');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @example
 * addPlugSensor(true);
 */
async function addPlugSensor(sid) {
  logger.debug(`Xiaomi : set RAM variable and update value`);
  this.sensor[sid] = {
    service_id: this.serviceId,
    name: `xiaomi-${sid}-sensor-plug`,
    external_id: `${sid}`,
    should_poll: false,
    features: [
      {
        name: `xiaomi-${sid}-battery`,
        external_id: `xiaomibattery:${sid}:decimal:battery`,
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
        name: `xiaomi-${sid}-status`,
        external_id: `xiaomimagnet:${sid}:binary:plug`,
        category: 'plug',
        type: 'binary',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: false,
        max: true,
      },
    ],
  };
}

module.exports = {
  addPlugSensor,
};
