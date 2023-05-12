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
 * @description New value switch received.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueSwitch(122324, {
 *    voltage: 3000,
 *    status: 1
 * });
 */
function newValueSwitch(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value switch, sid = ${sid}`);
  const newSensor = {
    service_id: this.serviceId,
    name: `Xiaomi Switch`,
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-switch',
    should_poll: false,
    features: [
      {
        name: 'Switch',
        selector: `xiaomi:${sid}:button:click`,
        external_id: `xiaomi:${sid}:button:click`,
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
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

  if (data.status) {
    const switchStatus = data.status.toUpperCase();
    if (SWITCH_STATUS[switchStatus]) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `xiaomi:${sid}:button:click`,
        state: SWITCH_STATUS[switchStatus],
      });
    }
  }
}

module.exports = {
  newValueSwitch,
};
