const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const { getDeviceFeature } = require('../../../../utils/device');

/**
 * @description Poll value of a Kodi Media Center
 * @param {Object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {
  const pingResult = await this.pingKodi(device.id);

  const currentBinaryState = pingResult === 'pong' ? 1 : 0;
  const binaryFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.KODI, DEVICE_FEATURE_TYPES.KODI.PING);

  if (binaryFeature && binaryFeature.last_value !== currentBinaryState) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${device.id}`,
      state: currentBinaryState,
    });
  }
}

module.exports = {
  poll,
};
