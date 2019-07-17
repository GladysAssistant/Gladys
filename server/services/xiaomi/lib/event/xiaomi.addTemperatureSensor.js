const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
/**
 * @description Add node
 * @param {number} sid - Id sensor.
 * @param {number} temperature - Temperature sensor.
 * @param {number} humidity - Humidity sensor.
 * @param {number} pressure - Pressure sensor.
 * @param {number} battery - Battery sensor.
 * @example
 * addTemperatureSensor(true);
 */
async function addTemperatureSensor(sid, temperature, humidity, pressure, battery) {
  logger.debug(`Xiaomi : set RAM variable and update value`);

  this.temperatureSensor[sid] = {
    service_id: this.serviceId,
    name: `xiaomi-${sid}-sensor-temp-hum-pression`,
    external_id: `xiaomi-${sid}`,
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
  try {
    const devices = await this.gladys.device.get({ where: { external_id: { $like: `%${sid}` } } });
    devices.map((device) => {
      if (device.external_id === `xiaomi-${sid}`) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: device.features[0].external_id,
          state: battery,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: device.features[1].external_id,
          state: temperature,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: device.features[2].external_id,
          state: humidity,
        });
      }
      return null;
    });
  } catch (e) {
    logger.debug(`No xiaomi sensor available`);
  }
}

module.exports = {
  addTemperatureSensor,
};
