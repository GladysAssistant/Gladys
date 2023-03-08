const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');

const BATTERY_FEATURE_INDEX = 1;

/**
 * @description Ecovacs onMessage callback.
 * @param {string} type - Type of event.
 * @param {Object} device - Concerned Gladys device.
 * @param {any} value - Value from event.
 * @example
 * vacbot.onMessage('BatteryInfo', device, 100);
 */
function onMessage(type, device, value) {
  logger.trace(`ECOVACS EVENT TYPE: ${type}`);
  logger.trace(`ECOVACS EVENT VALUE: ${value}`);
  logger.trace(`Device ExtID: ${device.external_id}`);
  switch (type) {
    case 'BatteryInfo':
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${device.features[BATTERY_FEATURE_INDEX].external_id}`,
        state: Math.round(value),
      });
      break;
    default:
      logger.info(`Event is not handled yet.`);
  }
}
module.exports = {
  onMessage,
};
