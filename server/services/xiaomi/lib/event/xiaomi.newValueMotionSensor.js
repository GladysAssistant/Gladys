const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { MOTION_STATUS } = require('../utils/deviceStatus');
const { getBatteryPercent } = require('../utils/getBatteryPercent');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description Add Xiaomi Motion sensor.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueMotionSensor(1234);
 */
function newValueMotionSensor(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value motion sensor, sid = ${sid}`);
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Motion Sensor`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-motion',
    should_poll: false,
    features: [
      {
        name: 'Motion',
        selector: `xiaomi:${sid}:motion`,
        external_id: `xiaomi:${sid}:motion`,
        category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
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

  // if lux is present, sensor has lux feature
  if (data.lux) {
    newSensor.features.push({
      name: 'Luminosity',
      selector: `xiaomi:${sid}:luminosity`,
      external_id: `xiaomi:${sid}:luminosity`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.LUX,
      read_only: true,
      keep_history: true,
      has_feedback: true,
      min: 0,
      max: 1200,
    });
  }

  this.addDevice(sid, newSensor);

  // emit new battery value event
  if (data.voltage) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:battery`,
      state: getBatteryPercent(data.voltage, MIN_VOLT, MAX_VOLT),
    });
  }
  // if a motion is detected, emit motion event
  if (data.status === 'motion') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:motion`,
      state: MOTION_STATUS.MOTION,
    });
  }
  // if no motion event is detected, emit no-motion event
  if (data.no_motion) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:motion`,
      state: MOTION_STATUS.NO_MOTION,
    });
  }
  if (data.lux) {
    // emit new status event
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:luminosity`,
      state: data.lux,
    });
  }
}

module.exports = {
  newValueMotionSensor,
};
