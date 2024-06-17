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
    // Filter unknown models
    .filter((d) => d.definition !== null)
    // Convert to Gladys device
    .map((d) => convertDevice(d, this.serviceId))
    .map((d) => {
      // Remove features with duplicate external_id
      // This code is needed because AQARA motion sensor
      // Returns 2 illuminance features and it doesn't work with Gladys
      d.features = d.features.reduce((acc, current) => {
        const isDuplicate = acc.some((feature) => feature.external_id === current.external_id);
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);
      return d;
    })
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
