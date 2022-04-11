const { hasDeviceChanged } = require('../../../utils/device');
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
        // Check if updatable
        const existingDevice = this.gladys.stateManager.get('deviceByExternalId', d.external_id);
        const device = { ...(existingDevice || {}), ...d };
        if (existingDevice) {
          device.updatable = hasDeviceChanged(device, existingDevice);
        }
        return device;
      })
  );
}

module.exports = {
  getDiscoveredDevices,
};
