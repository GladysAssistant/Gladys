const { mergeDevices } = require('../../../utils/device');
const { convertDevice } = require('../utils/convertDevice');

/**
 * @description Get discovered devices.
 * @returns {Array} Array of discovered devices.
 * @example
 * getDiscoveredDevices();
 */
function getDiscoveredDevices() {
  return (
    Object.values(this.discoveredDevices)
      // Convert to Gladys device
      .map((d) => convertDevice(d, this.serviceId))
      .map((d) => {
        const existingDevice = this.gladys.stateManager.get('deviceByExternalId', d.external_id);
        // Merge with existing device.
        return mergeDevices(d, existingDevice);
      })
  );
}

module.exports = {
  getDiscoveredDevices,
};
