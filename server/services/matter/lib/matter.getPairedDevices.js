const { addEnergyFeatures } = require('../../energy-monitoring/utils/addEnergyFeatures');
const { isEnergyIndexFeature } = require('../../../utils/energyHierarchy');

// the features the core derives from a cumulative index (addEnergyFeatures naming)
const DERIVED_SUFFIXES = ['_consumption', '_cost'];

/**
 * @description Add the energy-tracking features of a paired device carrying a cumulative index
 * (docs/specs/energy-hierarchy.md, section F), like Zigbee2mqtt: the features already in Gladys
 * keep their id and their parent, the derived features already in Gladys are re-injected while
 * their index is still published, then addEnergyFeatures adds the missing ones. The device held
 * in memory by the handler is left untouched: a copy is returned.
 * @param {object} device - The paired device.
 * @param {object|null} existingDevice - The device already in Gladys, if any.
 * @param {string|null} defaultElectricMeterFeatureId - The main meter feature.
 * @returns {object} The device to show on the discovery screen.
 * @example
 * withEnergyFeatures(device, existingDevice, 'feature-id');
 */
function withEnergyFeatures(device, existingDevice, defaultElectricMeterFeatureId) {
  const indexExternalIds = new Set(device.features.filter(isEnergyIndexFeature).map((f) => f.external_id));
  if (indexExternalIds.size === 0) {
    return device;
  }
  const existingFeatures = (existingDevice && existingDevice.features) || [];
  const existingByExternalId = new Map(existingFeatures.map((feature) => [feature.external_id, feature]));
  const features = device.features.map((feature) => {
    const existing = existingByExternalId.get(feature.external_id);
    if (!existing) {
      return { ...feature };
    }
    // the "Update" gesture posts this object back: the existing row is updated, its parent kept
    return {
      ...feature,
      id: existing.id,
      ...(existing.energy_parent_id ? { energy_parent_id: existing.energy_parent_id } : {}),
    };
  });
  existingFeatures
    .filter((existing) =>
      DERIVED_SUFFIXES.some(
        (suffix) =>
          existing.external_id.endsWith(suffix) && indexExternalIds.has(existing.external_id.slice(0, -suffix.length)),
      ),
    )
    .forEach((existing) => features.push({ ...existing }));
  return addEnergyFeatures({ ...device, features }, defaultElectricMeterFeatureId);
}

/**
 * @description The paired devices, for the discovery screen, with the energy-tracking features
 * of the ones carrying a cumulative index.
 * @returns {Promise<Array>} The paired devices.
 * @example
 * await matterHandler.getPairedDevices();
 */
async function getPairedDevices() {
  const devices = this.getDevices();
  if (!devices.some((device) => device.features.some(isEnergyIndexFeature))) {
    return devices;
  }
  const defaultElectricMeterFeatureId = await this.gladys.energyPrice.getDefaultElectricMeterFeatureId();
  return devices.map((device) =>
    withEnergyFeatures(
      device,
      this.gladys.stateManager.get('deviceByExternalId', device.external_id),
      defaultElectricMeterFeatureId,
    ),
  );
}

module.exports = {
  getPairedDevices,
  withEnergyFeatures,
};
