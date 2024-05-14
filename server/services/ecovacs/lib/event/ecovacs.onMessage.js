const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');

const BATTERY_FEATURE_INDEX = 1;
const CLEAN_REPORT_FEATURE_INDEX = 2;

/**
 * @description Ecovacs onMessage callback.
 * @param {string} type - Type of event.
 * @param {object} device - Concerned Gladys device.
 * @param {any} value - Value from event.
 * @example
 * vacbot.onMessage('BatteryInfo', device, 100);
 */
function onMessage(type, device, value) {
  switch (type) {
    case 'BatteryInfo':
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${device.features[BATTERY_FEATURE_INDEX].external_id}`,
        state: Math.round(value),
      });
      break;
    case 'CleanReport':
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${device.features[CLEAN_REPORT_FEATURE_INDEX].external_id}`,
        text: value,
      });
      break;
    default:
      logger.info(`Event ${type} with value "${value}" is not handled yet.`);
  }
}
module.exports = {
  onMessage,
};
