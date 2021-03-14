const logger = require('../../../../utils/logger');
const { decodeManufacturerData } = require('../utils/awox.decodeManufacturerData');

/**
 * @description Get AwoX identified devices.
 * @returns {Array} AwoX devices.
 * @example
 * awox.getDiscoveredDevices();
 */
function getDiscoveredDevices() {
  logger.debug(`AwoX: looking for discovered devices...`);
  const bluetoothDevices = this.bluetooth.getDiscoveredDevices();
  return bluetoothDevices
    .map((device) => {
      const [, peripheralUuid] = device.external_id.split(':');
      const peripheral = this.bluetooth.getPeripheral(peripheralUuid);
      const manufacturerData = decodeManufacturerData(peripheral);
      const awoxType = this.determineHandler(device, manufacturerData);
      if (awoxType) {
        return this.prepareDevice(device, awoxType, manufacturerData);
      }

      return null;
    })
    .filter((device) => device !== null);
}

module.exports = {
  getDiscoveredDevices,
};
