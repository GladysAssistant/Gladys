const logger = require('../../../../utils/logger');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const { WIRED_SWITCH_STATUS } = require('../utils/deviceStatus');

/**
 * @description New value duplex wired switch neutral received.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueDuplexWiredSwitchNeutral({model:''}, {
 *    channel_0: 'on'
 * });
 */
function newValueDuplexWiredSwitchNeutral(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value duplex wired switch neutral, sid = ${sid}`);
  const EXTERNAL_ID_CHANNEL_0_BINARY = `xiaomi:${sid}:duplex-wired-switch-neutral:channel-0:binary`;
  const EXTERNAL_ID_CHANNEL_1_BINARY = `xiaomi:${sid}:duplex-wired-switch-neutral:channel-1:binary`;
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Duplex Wired Switch Neutral`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-duplex-wired-switch-neutral',
    should_poll: false,
    features: [
      {
        name: 'Button 1',
        selector: EXTERNAL_ID_CHANNEL_0_BINARY,
        external_id: EXTERNAL_ID_CHANNEL_0_BINARY,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'Button 2',
        selector: EXTERNAL_ID_CHANNEL_1_BINARY,
        external_id: EXTERNAL_ID_CHANNEL_1_BINARY,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1,
      },
    ],
  };
  this.addDevice(sid, newSensor);

  if (data.channel_0 === 'on') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: EXTERNAL_ID_CHANNEL_0_BINARY,
      state: WIRED_SWITCH_STATUS.ON,
    });
  }

  if (data.channel_0 === 'off') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: EXTERNAL_ID_CHANNEL_0_BINARY,
      state: WIRED_SWITCH_STATUS.OFF,
    });
  }

  if (data.channel_1 === 'on') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: EXTERNAL_ID_CHANNEL_1_BINARY,
      state: WIRED_SWITCH_STATUS.ON,
    });
  }

  if (data.channel_1 === 'off') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: EXTERNAL_ID_CHANNEL_1_BINARY,
      state: WIRED_SWITCH_STATUS.OFF,
    });
  }
}

module.exports = {
  newValueDuplexWiredSwitchNeutral,
};
