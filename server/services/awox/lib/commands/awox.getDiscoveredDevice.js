const { NotFoundError, BadParameters } = require('../../../../utils/coreErrors');
const { decodeManufacturerData } = require('../utils/awox.decodeManufacturerData');

/**
 * @description Get device from Bluetooth service and adapt it as AwoX device.
 * @param {string} peripheralUuid - Bluetooth device uuid.
 * @returns {Object} Returns device according to this UUID.
 * @example
 * awox.getDiscoveredDevice('d03975bc5a71');
 */
function getDiscoveredDevice(peripheralUuid) {
  const device = this.bluetooth.getDiscoveredDevice(peripheralUuid);
  if (!device) {
    throw new NotFoundError(`AwoX: No Bluetooth ${peripheralUuid} device found`);
  }

  const peripheral = this.bluetooth.getPeripheral(peripheralUuid);
  const manufacturerData = decodeManufacturerData(peripheral);
  const awoxType = this.determineHandler(device, manufacturerData);
  if (!awoxType) {
    throw new BadParameters(`AwoX: No handler matching device ${peripheralUuid}`);
  }

  return this.prepareDevice(device, awoxType, manufacturerData);
}

module.exports = {
  getDiscoveredDevice,
};
