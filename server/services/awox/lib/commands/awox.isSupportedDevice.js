const { decodeManufacturerData } = require('../utils/awox.decodeManufacturerData');

/**
 * @description Loop over available hanlders to check if device is supported by AwoX.
 * @param {Object} device - Gladys device.
 * @returns {boolean} Is the device compatible?
 * @example
 * awox.isSupportedDevice({ name: 'awox' });
 */
function isSupportedDevice(device) {
  const [, peripheralUuid] = device.external_id.split(':');
  const peripheral = this.bluetooth.getPeripheral(peripheralUuid);
  const manufacturerData = decodeManufacturerData(peripheral);
  return Object.values(this.handlers).some((handler) => handler.isSupportedDevice(device, manufacturerData));
}

module.exports = {
  isSupportedDevice,
};
