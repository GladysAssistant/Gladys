const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { CUBE_STATUS } = require('../utils/deviceStatus');
const { getBatteryPercent } = require('../utils/getBatteryPercent');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description New value cube received.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueCube(122324, {
 *    voltage: 3000,
 *    status: 1
 * });
 */
function newValueCube(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value cube, sid = ${sid}`);
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Cube`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-cube',
    should_poll: false,
    features: [
      {
        name: 'Cube Mode',
        selector: `xiaomi:${sid}:cube:mode`,
        external_id: `xiaomi:${sid}:cube:mode`,
        category: DEVICE_FEATURE_CATEGORIES.CUBE,
        type: DEVICE_FEATURE_TYPES.CUBE.MODE,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'Cube Rotation',
        selector: `xiaomi:${sid}:cube:rotation`,
        external_id: `xiaomi:${sid}:cube:rotation`,
        category: DEVICE_FEATURE_CATEGORIES.CUBE,
        type: DEVICE_FEATURE_TYPES.CUBE.ROTATION,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -180,
        max: 180,
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
  if (data.status) {
    const cubeStatus = data.status.toUpperCase();
    if (CUBE_STATUS[cubeStatus]) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `xiaomi:${sid}:cube:mode`,
        state: CUBE_STATUS[cubeStatus],
      });
    }
  }
  if (data.rotate) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:cube:rotation`,
      state: data.rotate,
    });
  }
}

module.exports = {
  newValueCube,
};
