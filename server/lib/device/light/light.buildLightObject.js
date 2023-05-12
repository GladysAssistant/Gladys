const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

/**
 * @description Add functions to light object.
 * @param {object} device - The device to build the light object from.
 * @returns {object} Return a device with functions.
 * @example
 * buildLightObject({
 *    id: '3d8496a6-bfff-4920-8f12-4767d93fd67f',
 *    selector: 'test-lamp',
 *    features: []
 * });
 */
function buildLightObject(device) {
  const self = this;
  // find binary deviceType
  const binaryDeviceFeature = device.features.find(
    (deviceFeature) => deviceFeature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY,
  );
  if (binaryDeviceFeature) {
    device.turnOn = async () => self.turnOn(device, binaryDeviceFeature);
    device.turnOff = async () => self.turnOff(device, binaryDeviceFeature);
  }
  return device;
}

module.exports = {
  buildLightObject,
};
