const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { LEAK_STATUS } = require('../utils/deviceStatus');
const { getBatteryPercent } = require('../utils/getBatteryPercent');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description New Xiaomi Leak value.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueLeak(122324, {
 *    voltage: 3000,
 *    status: 'leak'
 * });
 */
function newValueLeak(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value leak sensor, sid = ${sid}`);
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Leak`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-leak',
    should_poll: false,
    features: [
      {
        name: 'Leak Sensor',
        selector: `xiaomi:${sid}:leak`,
        external_id: `xiaomi:${sid}:leak`,
        category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
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
  // if leak is detected
  if (data.status === 'leak') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:leak`,
      state: LEAK_STATUS.LEAK,
    });
  }
  // if leak is detected
  if (data.status === 'no_leak') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:leak`,
      state: LEAK_STATUS.NO_LEAK,
    });
  }
}

module.exports = {
  newValueLeak,
};
