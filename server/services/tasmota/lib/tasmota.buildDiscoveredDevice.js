const { addEnergyFeatures } = require('../../energy-monitoring/utils/addEnergyFeatures');
const { mergeDevices } = require('../../../utils/device');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const isTasmotaTotalEnergyIndex = (feature) => {
  const externalId = feature.external_id || feature.selector || '';
  return (
    feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
    feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY &&
    (/:ENERGY:Total(\d+)?$/i.test(externalId) || /StatusSNS\.ENERGY\.Total$/i.test(externalId))
  );
};

const ensureExistingEnergyDerivedFeatures = (device, existing) => {
  if (!existing || !Array.isArray(existing.features)) {
    return;
  }
  if (!Array.isArray(device.features)) {
    device.features = [];
  }

  // IMPORTANT: mergeDevices drops features not present in discovery.
  // Re-inject derived energy features (consumption/cost) so they are not lost on update.
  const existingEnergyDerivedFeatures = existing.features.filter(
    (f) =>
      f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
      [
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
      ].includes(f.type),
  );

  existingEnergyDerivedFeatures.forEach((feature) => {
    const alreadyPresent = device.features.some((f) => f.external_id === feature.external_id);
    if (!alreadyPresent) {
      device.features.push(feature);
    }
  });
};

const buildDiscoveredDevice = (device, existing, defaultElectricMeterDeviceFeatureId) => {
  ensureExistingEnergyDerivedFeatures(device, existing);

  const mergedDevice = mergeDevices(device, existing);
  const beforeFeaturesCount = Array.isArray(mergedDevice.features) ? mergedDevice.features.length : 0;

  addEnergyFeatures(mergedDevice, defaultElectricMeterDeviceFeatureId, {
    filterIndexFeature: isTasmotaTotalEnergyIndex,
  });

  if (existing && mergedDevice.features.length !== beforeFeaturesCount) {
    mergedDevice.updatable = true;
  }

  return mergedDevice;
};

module.exports = {
  buildDiscoveredDevice,
  isTasmotaTotalEnergyIndex,
};
