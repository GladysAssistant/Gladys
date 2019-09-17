const logger = require('../../../../utils/logger');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @example
 * addMotionSensor(true);
 */
async function addMotionSensor(sid) {
  logger.debug(`Xiaomi : set RAM variable and update value`);
  this.sensor[sid] = {
    service_id: this.serviceId,
    name: `xiaomi-${sid}-sensor-motion`,
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
        name: `xiaomi-${sid}-detect`,
        external_id: `xiaomimotion:${sid}:binary:motion`,
        category: 'motion-sensor',
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
  addMotionSensor,
};
