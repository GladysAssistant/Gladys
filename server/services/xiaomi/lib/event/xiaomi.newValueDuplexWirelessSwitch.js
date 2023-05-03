const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { SWITCH_STATUS } = require('../utils/deviceStatus');

const { getBatteryPercent } = require('../utils/getBatteryPercent');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description New value duplex wireless switch received.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueDuplexWirelessSwitch({model:''}, {
 *    channel_0: 'on'
 * });
 */
function newValueDuplexWirelessSwitch(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value duplex wireless switch, sid = ${sid}`);
  const EXTERNAL_ID_CHANNEL_0_BUTTON = `xiaomi:${sid}:duplex-wireless-switch:channel-0:button`;
  const EXTERNAL_ID_CHANNEL_1_BUTTON = `xiaomi:${sid}:duplex-wireless-switch:channel-1:button`;
  const EXTERNAL_ID_DUAL_CHANNEL_BUTTON = `xiaomi:${sid}:duplex-wireless-switch:dual-channel:button`;
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Duplex Wireless Switch`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-duplex-wireless-switch',
    should_poll: false,
    features: [
      {
        name: 'Button 1',
        selector: EXTERNAL_ID_CHANNEL_0_BUTTON,
        external_id: EXTERNAL_ID_CHANNEL_0_BUTTON,
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
        read_only: false,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 2,
      },
      {
        name: 'Button 2',
        selector: EXTERNAL_ID_CHANNEL_1_BUTTON,
        external_id: EXTERNAL_ID_CHANNEL_1_BUTTON,
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
        read_only: false,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 2,
      },
      {
        name: 'Dual Channel',
        selector: EXTERNAL_ID_DUAL_CHANNEL_BUTTON,
        external_id: EXTERNAL_ID_DUAL_CHANNEL_BUTTON,
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
        read_only: false,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 3,
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

  if (data.voltage) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:battery`,
      state: getBatteryPercent(data.voltage, MIN_VOLT, MAX_VOLT),
    });
  }

  // BUTTON 1
  if (data.channel_0) {
    const currentStatusMaj = data.channel_0.toUpperCase();
    if (SWITCH_STATUS[currentStatusMaj]) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: EXTERNAL_ID_CHANNEL_0_BUTTON,
        state: SWITCH_STATUS[currentStatusMaj],
      });
    }
  }

  // BUTTON 2
  if (data.channel_1) {
    const currentStatusMaj = data.channel_1.toUpperCase();
    if (SWITCH_STATUS[currentStatusMaj]) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: EXTERNAL_ID_CHANNEL_1_BUTTON,
        state: SWITCH_STATUS[currentStatusMaj],
      });
    }
  }

  // BOTH BUTTON
  if (data.dual_channel) {
    const currentStatusMaj = data.dual_channel.toUpperCase();
    if (SWITCH_STATUS[currentStatusMaj]) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: EXTERNAL_ID_DUAL_CHANNEL_BUTTON,
        state: SWITCH_STATUS[currentStatusMaj],
      });
    }
  }
}

module.exports = {
  newValueDuplexWirelessSwitch,
};
