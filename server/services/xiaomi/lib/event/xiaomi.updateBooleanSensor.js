const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @param {Object} data - Object info sensor.
 * @example
 * updateBooleanSensor(true);
 */
async function updateBooleanSensor(sid, data) {
  let value = 0;
  if (data === true) {
    value = 1;
  } else {
    value = 0;
  }
  logger.debug(`Xiaomi : update value`);
  if (data) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: this.sensor[sid].features[1].external_id,
      state: value,
    });
  }
}

module.exports = {
  updateBooleanSensor,
};
