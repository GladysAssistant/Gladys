const { addEnergyFeatures } = require('../../energy-monitoring/utils/addEnergyFeatures');
const { mergeDevices } = require('../../../utils/device');
const { dedupeFeaturesByExternalId } = require('./utils/tasmota.dedupeFeaturesByExternalId');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {string} protocol - Protocol to filter devices.
 * @param {string} defaultElectricMeterDeviceFeatureId - Default electric meter device feature ID.
 * @returns {*} Discovered devices.
 * @example
 * getDiscoveredDevices()
 */
function getDiscoveredDevices(protocol, defaultElectricMeterDeviceFeatureId) {
  const handlerDevices = this.getHandler(protocol).getDiscoveredDevices();
  return Object.values(handlerDevices).map((d) => {
    const device = {
      ...d,
      features: Array.isArray(d.features) ? d.features.map((feature) => ({ ...feature })) : d.features,
    };
    const existing = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
    if (Array.isArray(device.features)) {
      device.features = dedupeFeaturesByExternalId(device.features);
      addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);
    }
    return mergeDevices(device, existing);
  });
}

module.exports = {
  getDiscoveredDevices,
};
