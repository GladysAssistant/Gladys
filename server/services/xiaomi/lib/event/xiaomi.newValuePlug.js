const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { PLUG_STATUS } = require('../utils/deviceStatus');

/**
 * @description New value plug received.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValuePlug(122324, {
 *    voltage: 3000,
 *    status: 1
 * });
 */
function newValuePlug(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value plug, sid = ${sid}`);
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Plug`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-plug',
    should_poll: false,
    features: [
      {
        name: 'On/Off',
        selector: `xiaomi:${sid}:plug:binary`,
        external_id: `xiaomi:${sid}:plug:binary`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'Power',
        selector: `xiaomi:${sid}:plug:power`,
        external_id: `xiaomi:${sid}:plug:power`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
        unit: DEVICE_FEATURE_UNITS.KILOWATT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 2200,
      },
      {
        name: 'Energy',
        selector: `xiaomi:${sid}:plug:energy`,
        external_id: `xiaomi:${sid}:plug:energy`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 999999,
      },
      {
        name: 'In use',
        selector: `xiaomi:${sid}:plug:in-use`,
        external_id: `xiaomi:${sid}:plug:in-use`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1,
      },
    ],
  };
  this.addDevice(sid, newSensor);

  if (data.load_power) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:plug:power`,
      state: data.load_power,
    });
  }

  if (data.power_consumed) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:plug:energy`,
      state: data.power_consumed,
    });
  }

  if (data.status === 'on') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:plug:binary`,
      state: PLUG_STATUS.ON,
    });
  }

  if (data.status === 'off') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:plug:binary`,
      state: PLUG_STATUS.OFF,
    });
  }

  if (data.inuse !== undefined) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:plug:in-use`,
      state: data.inuse,
    });
  }
}

module.exports = {
  newValuePlug,
};
