const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @param {boolean} closed - Closed magnet sensor.
 * @param {number} battery - Battery sensor.
 * @example
 * addSensorMagnet(true);
 */
async function addSensorMagnet(sid, closed, battery) {
  logger.debug(`Xiaomi : set RAM variable and update value`);

  this.sensorMagnet[sid] = {
    service_id: this.serviceId,
    name: `xiaomi-${sid}-sensor-magnet`,
    external_id: `xiaomi:${sid}`,
    should_poll: false,
    features: [
      {
        name: `xiaomi-${sid}-closed`,
        external_id: `xiaomimagnet:${sid}:binary:magnet`,
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
  try {
    let value = 0;
    if (closed === true) {
      value = 1;
    } else {
      value = 0;
    }
    const device = await this.gladys.device.get({ search: sid });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: device[0].features[0].external_id,
      state: value,
    });
  } catch (e) {
    logger.debug(`No xiaomi sensor magnet available`);
  }
}

module.exports = {
  addSensorMagnet,
};
