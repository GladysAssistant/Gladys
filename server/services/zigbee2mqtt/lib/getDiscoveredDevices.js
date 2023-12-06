const { mergeDevices } = require('../../../utils/device');
const { convertDevice } = require('../utils/convertDevice');

/**
 * @description Get discovered devices.
 * @param {object} filters - Filters to apply.
 * @returns {Array} Array of discovered devices.
 * @example
 * getDiscoveredDevices();
 */
function getDiscoveredDevices(filters = {}) {
  let devices = Object.values(this.discoveredDevices)
    // Convert to Gladys device
    .map((d) => convertDevice(d, this.serviceId))
    .map((d) => {
      const existingDevice = this.gladys.stateManager.get('deviceByExternalId', d.external_id);
      // Merge with existing device.
      return mergeDevices(d, existingDevice);
    });

  const { filter_existing: filterExisting } = filters;
  if (`${filterExisting}` === 'true') {
    devices = devices.filter((device) => device.id === undefined || device.updatable);
  }

  return devices;
}

module.exports = {
  getDiscoveredDevices,
};
