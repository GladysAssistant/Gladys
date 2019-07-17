const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
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
  try {
    let value = 0;
    if (closed === true) {
      value = 1;
    } else {
      value = 0;
    }
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: this.sensor[sid].features[1].external_id,
      state: value,
    });
  } catch (e) {
    logger.debug(`No xiaomi sensor magnet available`);
  }
}

module.exports = {
  addMagnetSensor,
};
