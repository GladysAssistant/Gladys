const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
// eslint-disable-next-line jsdoc/require-param
/**
 * @description When a new value is received.
 * @param {object} device - Device to update.
 * @param {string} deviceFeature - Feature to update.
 * @param {string} state - State.
 * @example
 *  newValue(Object, 'temperature', 30)
 */
function newValue(device, deviceFeature, state) {
  logger.debug(
    `RFlink : value ${deviceFeature} of device rflink:${device.id}:${deviceFeature}:${device.switch} changed to ${state}`,
  );
  let value = state;
  switch (state) {
    case 'ON':
    case 'ALLON':
    case 'UP':
      value = 1;
      break;
    case 'OFF':
    case 'ALLOFF':
    case 'DOWN':
      value = 0;
      break;
    default:
      value = state;
      break;
  }
  switch (deviceFeature) {
    case 'temperature':
      value = parseInt(value, 16);
      value /= 10;
      break;
    case 'battery':
      value = 'NA';
      break;
    case 'uv':
    case 'light-intensity':
      value = parseInt(value, 16);
      break;
    case 'pressure':
      value = parseInt(value, 16);
      break;

    default:
      break;
  }
  if (deviceFeature !== undefined) {
    if (device.id !== undefined) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
        state: value,
      });
    } else {
      logger.debug(`device id to change: ${device.id}`);
    }
  } else {
    logger.debug(`device feature to change: ${deviceFeature}`);
  }
}

module.exports = {
  newValue,
};
