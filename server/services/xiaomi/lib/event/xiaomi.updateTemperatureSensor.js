const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @param {Object} data - Object info sensor.
 * @example
 * updateTemperatureSensor(true);
 */
async function updateTemperatureSensor(sid, data) {
  logger.debug(`Xiaomi : update value`);
  if (data.temperature) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: this.sensor[sid].features[1].external_id,
      state: data.temperature,
    });
  }
  if (data.voltage) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: this.sensor[sid].features[0].external_id,
      state: data.voltage,
    });
  }
  if (data.humidity) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: this.sensor[sid].features[2].external_id,
      state: data.humidity,
    });
  }
}

module.exports = {
  updateTemperatureSensor,
};
