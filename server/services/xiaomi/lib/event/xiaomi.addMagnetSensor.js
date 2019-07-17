const logger = require('../../../../utils/logger');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @param {boolean} closed - Closed magnet sensor.
 * @example
 * addMagnetSensor(true);
 */
async function addMagnetSensor(sid, closed) {
  logger.debug(`Xiaomi : set RAM variable and update value`);
  this.sensor[sid] = {
    service_id: this.serviceId,
    name: `xiaomi-${sid}-sensor-magnet`,
    external_id: `xiaomi-${sid}`,
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
        name: `xiaomi-${sid}-closed`,
        external_id: `xiaomimagnet:${sid}:binary:magnet`,
        category: 'door-opening-sensor',
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
  addMagnetSensor,
};
