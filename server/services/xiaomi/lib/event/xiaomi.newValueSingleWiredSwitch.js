const logger = require('../../../../utils/logger');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const { WIRED_SWITCH_STATUS } = require('../utils/deviceStatus');

/**
 * @description New value single wired switch received.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueSingleWiredSwitch({model:''}, {
 *    channel_0: 'on'
 * });
 */
function newValueSingleWiredSwitch(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value single wired switch, sid = ${sid}`);
  const EXTERNAL_ID_BINARY = `xiaomi:${sid}:single-wired-switch:binary`;
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Single Wired Switch`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-single-wired-switch',
    should_poll: false,
    features: [
      {
        name: 'On/Off',
        selector: EXTERNAL_ID_BINARY,
        external_id: EXTERNAL_ID_BINARY,
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
      device_feature_external_id: EXTERNAL_ID_BINARY,
      state: WIRED_SWITCH_STATUS.ON,
    });
  }

  if (data.channel_0 === 'off') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: EXTERNAL_ID_BINARY,
      state: WIRED_SWITCH_STATUS.OFF,
    });
  }
}

module.exports = {
  newValueSingleWiredSwitch,
};
