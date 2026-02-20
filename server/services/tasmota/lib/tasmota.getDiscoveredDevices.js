const { addEnergyFeatures } = require('../../energy-monitoring/utils/addEnergyFeatures');
const { mergeDevices } = require('../../../utils/device');

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
    const existing = this.gladys.stateManager.get('deviceByExternalId', d.external_id);
    if (Array.isArray(d.features)) {
      d.features = d.features.reduce((acc, feature) => {
        if (!feature || !feature.external_id) {
          acc.push(feature);
          return acc;
        }
        const isDuplicate = acc.some((existingFeature) => existingFeature.external_id === feature.external_id);
        if (!isDuplicate) {
          acc.push(feature);
        }
        return acc;
      }, []);
      addEnergyFeatures(d, defaultElectricMeterDeviceFeatureId);
    }
    return mergeDevices(d, existing);
  });
}

module.exports = {
  getDiscoveredDevices,
};
