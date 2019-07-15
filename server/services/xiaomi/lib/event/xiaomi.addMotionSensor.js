const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @param {boolean} motion - Closed motion sensor.
 * @param {number} battery - Battery sensor.
 * @example
 * addMotionSensor(true);
 */
async function addMotionSensor(sid, motion) {
  logger.debug(`Xiaomi : set RAM variable and update value`);
  this.motionSensor[sid] = {
    service_id: this.serviceId,
    name: `xiaomi-${sid}-sensor-motion`,
    external_id: `xiaomi-${sid}`,
    should_poll: false,
    features: [
      {
        name: `xiaomi-${sid}-battery`,
        external_id: `xiaomibattery:${sid}:decimal:battery`,
        category: 'battery-sensor',
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
    if (motion === true) {
      value = 1;
    } else {
      value = 0;
    }
    const devices = await this.gladys.device.get({ where: { external_id: { $like: `%${sid}` } } });
    devices.map((device) => {
      if (device.external_id === `xiaomi-${sid}`) {
        // this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        //   device_feature_external_id: device.features[0].external_id,
        //   state: battery,
        // });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: device.features[0].external_id,
          state: value,
        });
      }
      return null;
    });
  } catch (e) {
    logger.debug(`No xiaomi sensor motion available`);
  }
}

module.exports = {
  addMotionSensor,
};
