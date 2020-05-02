const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
// eslint-disable-next-line jsdoc/require-param
/**
 * @description When a new value is received.
 * @param {Object} device - Device to update.
 * @param {string} deviceFeature - Feature to update.
 * @example
 *  newValue(Object, 'temperature', 30)
 */
function newValue(device, deviceFeature, state) {
  logger.log(
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
      value = 'non géré';
      break;
    case 'uv':
    case 'light-intensity':
      value = parseInt(value, 16);
      break;
    case 'pressure':
      value = parseInt(value, 16);
      logger.log(`baro : ${value}`);
      break;

    default:
      break;
  }

  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
    state: value,
  });
}

module.exports = {
  newValue,
};
