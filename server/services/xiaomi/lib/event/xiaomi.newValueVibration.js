const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { VIBRATION_STATUS } = require('../utils/deviceStatus');
const { getBatteryPercent } = require('../utils/getBatteryPercent');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description New value vibration received.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueVibration(122324, {
 *    voltage: 3000,
 *    status: 1
 * });
 */
function newValueVibration(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value vibration, sid = ${sid}`);
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Vibration`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-vibration',
    should_poll: false,
    features: [
      {
        name: 'Vibration Status',
        selector: `xiaomi:${sid}:vibration:status`,
        external_id: `xiaomi:${sid}:vibration:status`,
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.STATUS,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 3,
      },
      {
        name: 'Tilt Angle',
        selector: `xiaomi:${sid}:vibration:tilt-angle`,
        external_id: `xiaomi:${sid}:vibration:tilt-angle`,
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.TILT_ANGLE,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -360,
        max: 360,
      },
      {
        name: 'Acceleration X',
        selector: `xiaomi:${sid}:vibration:acceleration-x`,
        external_id: `xiaomi:${sid}:vibration:acceleration-x`,
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_X,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -8000,
        max: 8000,
      },
      {
        name: 'Acceleration Y',
        selector: `xiaomi:${sid}:vibration:acceleration-y`,
        external_id: `xiaomi:${sid}:vibration:acceleration-y`,
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_Y,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -8000,
        max: 8000,
      },
      {
        name: 'Acceleration Z',
        selector: `xiaomi:${sid}:vibration:acceleration-z`,
        external_id: `xiaomi:${sid}:vibration:acceleration-z`,
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ACCELERATION_Z,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -8000,
        max: 8000,
      },
      {
        name: 'Bed Activity',
        selector: `xiaomi:${sid}:vibration:bed-activity`,
        external_id: `xiaomi:${sid}:vibration:bed-activity`,
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.BED_ACTIVITY,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -8000,
        max: 8000,
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
    const statusMaj = data.status.toUpperCase();
    if (VIBRATION_STATUS[statusMaj] !== undefined) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `xiaomi:${sid}:vibration:status`,
        state: VIBRATION_STATUS[statusMaj],
      });
    }
  }

  if (data.final_tilt_angle) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:vibration:tilt-angle`,
      state: data.final_tilt_angle,
    });
  }

  if (data.coordination) {
    const accelerationX = parseInt(data.coordination.split(',')[0], 10);
    const accelerationY = parseInt(data.coordination.split(',')[1], 10);
    const accelerationZ = parseInt(data.coordination.split(',')[2], 10);
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:vibration:acceleration-x`,
      state: accelerationX,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:vibration:acceleration-y`,
      state: accelerationY,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:vibration:acceleration-z`,
      state: accelerationZ,
    });
  }

  if (data.bed_activity) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:vibration:bed-activity`,
      state: data.bed_activity,
    });
  }
}

module.exports = {
  newValueVibration,
};
