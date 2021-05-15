const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

/**
 * @description Add functions to media player object.
 * @param {Object} device - The device to build the media player object from.
 * @returns {Object} Return a device with functions.
 * @example
 * buildMediaPlayerObject({
 *    id: '3d8496a6-bfff-4920-8f12-4767d93fd67f',
 *    selector: 'test-player',
 *    features: []
 * });
 */
function buildMediaPlayerObject(device) {
  const self = this;
  // find binary deviceType
  const binaryDeviceFeature = device.features.find(
    (deviceFeature) => deviceFeature.type === DEVICE_FEATURE_TYPES.MEDIA_PLAYER.BINARY,
  );
  if (binaryDeviceFeature) {
    device.turnOn = async () => self.turnOn(device, binaryDeviceFeature);
    device.turnOff = async () => self.turnOff(device, binaryDeviceFeature);
  }
  return device;
}

module.exports = {
  buildMediaPlayerObject,
};
