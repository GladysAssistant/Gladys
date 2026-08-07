const { mergeDevices } = require('../../../../utils/device');
const { convertToGladysDevice } = require('./convertToGladysDevice');

/**
 * @description Get the devices discovered through the Home Assistant discovery protocol.
 * @param {object} filters - Filters to apply.
 * @returns {Array} Array of discovered devices, in Gladys format.
 * @example
 * getHomeAssistantDiscoveredDevices({ filter_existing: true });
 */
function getHomeAssistantDiscoveredDevices(filters = {}) {
  let devices = Object.values(this.haDiscoveredDevices)
    .map((discoveredDevice) => convertToGladysDevice(this.serviceId, discoveredDevice))
    .map((device) => {
      const existingDevice = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
      return mergeDevices(device, existingDevice);
    })
    .sort((deviceA, deviceB) => deviceA.name.localeCompare(deviceB.name));

  const { filter_existing: filterExisting } = filters;
  if (`${filterExisting}` === 'true') {
    devices = devices.filter((device) => device.id === undefined || device.updatable);
  }

  return devices;
}

module.exports = {
  getHomeAssistantDiscoveredDevices,
};
