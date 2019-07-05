const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
/**
 * @description Add node
 * @param {boolean} secure - Secure node.
 * @example
 * addSensorTh(true);
 */
async function addSensorTh(sid, temperature, humidity, pressure, battery) {
  this.sensorTh[sid] = {
    service_id: this.serviceId,
    name: `xiaomi-${sid}-temperature`,
    external_id: `xiaomi:${sid}`,
    should_poll: false,
    features: [
      {
        name: `xiaomi-${sid}-temperature`,
        external_id: `xiaomitemperature:${sid}:decimal:temperature`,
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
        external_id: `xiaomihumidity:${sid}:decimal`,
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
  const device = await this.gladys.device.get({ search: sid });
  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: device[0].features[0].external_id,
    state: temperature,
  });
  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: device[0].features[1].external_id,
    state: humidity,
  });
}

module.exports = {
  addSensorTh,
};
