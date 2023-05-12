const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { MAGNET_STATUS } = require('../utils/deviceStatus');
const { getBatteryPercent } = require('../utils/getBatteryPercent');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description Add Xiaomi Magnet Sensor.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * addMagnetSensor(122324, {
 *    voltage: 3000,
 *    status: 1
 * });
 */
function newValueMagnetSensor(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value magnet sensor, sid = ${sid}`);
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Magnet`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-magnet',
    should_poll: false,
    features: [
      {
        name: 'Opening Sensor',
        selector: `xiaomi:${sid}:magnet`,
        external_id: `xiaomi:${sid}:magnet`,
        category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'Battery',
        selector: `xiaomi:${sid}:battery`,
        external_id: `xiaomi:${sid}:battery`,
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
    ],
  };
  this.addDevice(sid, newSensor);

  // emit new battery value event
  if (data.voltage) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:battery`,
      state: getBatteryPercent(data.voltage, MIN_VOLT, MAX_VOLT),
    });
  }
  // if magnet was opened
  if (data.status === 'open') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:magnet`,
      state: MAGNET_STATUS.OPEN,
    });
  }
  // if magnet was closed
  if (data.status === 'close') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:magnet`,
      state: MAGNET_STATUS.CLOSE,
    });
  }
}

module.exports = {
  newValueMagnetSensor,
};
