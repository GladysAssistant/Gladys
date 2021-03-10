const { setDeviceParam } = require('../../../../utils/setDeviceParam');
const { DEVICE_PARAMS } = require('../utils/awox.constants');
const { generateFeature } = require('../utils/awox.features');

/**
 * @description Get device from Bluetooth service and adapt it as AwoX device.
 * @param {Object} device - Gladys device.
 * @param {string} awoxType - AwoX device type.
 * @param {Object} manufacturerData - Decrypted advertising message.
 * @returns {Object} Returns AwoX compatible device.
 * @example
 * awox.prepareDevice({ external_id: 'd03975bc5a71', 'mesh', { data: [ 0x60, 0x01 ], model: 1234 });
 */
function prepareDevice(device, awoxType, manufacturerData) {
  const awoxDeviceTemplate = this.handlers[awoxType].getDevice(device, manufacturerData);
  const features = awoxDeviceTemplate.features.map((feature) => generateFeature(feature, device.external_id));

  const awoxDevice = { ...device, ...awoxDeviceTemplate, features };
  setDeviceParam(awoxDevice, DEVICE_PARAMS.DEVICE_TYPE, awoxType);
  return awoxDevice;
}

module.exports = {
  prepareDevice,
};
