const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { convertFeature } = require('../utils/convertFeature');

/**
 * @description Send a value received from a Zigbee2mqtt device to the matching feature of its Gladys device, if any.
 * @param {object} device - Gladys device.
 * @param {string} deviceName - Zigbee2mqtt friendly name of the device.
 * @param {string} property - Zigbee2mqtt property.
 * @param {any} value - Zigbee2mqtt value.
 * @param {string} [createdAt] - Date at which an earlier value was received (ISO string): it is saved in the past,
 * except for a text feature, which Gladys always saves at the current date.
 * @example
 * emitDeviceState(device, 'salon/lampe', 'state', 'ON');
 */
function emitDeviceState(device, deviceName, property, value, createdAt) {
  const feature = convertFeature(device.features, property, value);
  if (!feature) {
    logger.debug(`Zigbee2mqtt device ${deviceName}, feature ${property} not configured in Gladys.`);
    return;
  }
  try {
    const newState = {
      device_feature_external_id: `${feature.external_id}`,
      state: this.readValue(deviceName, property, value),
    };
    if (createdAt) {
      newState.created_at = createdAt;
    }
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, newState);
  } catch (e) {
    logger.error(`Failed to convert value for device ${deviceName}:`, e);
  }
}

module.exports = {
  emitDeviceState,
};
