/**
 * @description Get all found preipherals as devices.
 * @param {Object} filters - Filters to apply.
 * @returns {Array} Return list of devices.
 * @example
 * const devices = lanManager.getDiscoveredDevices();
 */
function getDiscoveredDevices(filters = {}) {
  let devices = this.discoveredDevices
    .map((device) => this.transformDevice(device))
    .map((device) => this.mergeWithExistingDevice(device));

  const { filterExisting } = filters;
  if (`${filterExisting}` === 'true') {
    devices = devices.filter((device) => device.id === undefined);
  }

  return devices;
}

module.exports = {
  getDiscoveredDevices,
};
