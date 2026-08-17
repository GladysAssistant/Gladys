const { addEnergyFeatures } = require('../../services/energy-monitoring/utils/addEnergyFeatures');
const { ENERGY_INDEX_FEATURE_TYPES } = require('../../services/energy-monitoring/utils/constants');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

// The two features the core derives from a cumulative meter index, with the
// deterministic `<index external_id><suffix>` naming of addEnergyFeatures.
const DERIVED_ENERGY_FEATURES = [
  { type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION, suffix: '_consumption' },
  { type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST, suffix: '_cost' },
];

/**
 * @description Match a feature against the energy features the core derives
 * itself (an integration never publishes them).
 * @param {object} feature - The feature to test.
 * @returns {object|undefined} The matching derived feature descriptor, if any.
 * @example
 * const derived = matchDerivedEnergyFeature(feature);
 */
function matchDerivedEnergyFeature(feature) {
  if (feature.category !== DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR) {
    return undefined;
  }
  return DERIVED_ENERGY_FEATURES.find((derived) => derived.type === feature.type);
}

/**
 * @description Tell whether a device published by an integration carries at
 * least one cumulative energy index the core can derive energy tracking from.
 * @param {object} device - The device published by the integration.
 * @returns {boolean} True when the device carries an energy index feature.
 * @example
 * const hasIndex = hasEnergyIndexFeature(device);
 */
function hasEnergyIndexFeature(device) {
  return device.features.some(
    (feature) =>
      ENERGY_INDEX_FEATURE_TYPES[feature.category] &&
      ENERGY_INDEX_FEATURE_TYPES[feature.category].includes(feature.type),
  );
}

/**
 * @description Derive the energy-tracking features (30-minutes consumption and
 * its cost) of a published device, exactly as Zigbee2mqtt and Tasmota do on
 * their own discoveries: the integration declares its meter index only, the
 * core adds the rest, so energy monitoring works with no extra work in the
 * container. The published list stays untouched (it is the supervisor's
 * in-memory source of truth): the derivation works on a copy.
 * @param {object} device - The device published by the integration.
 * @param {object} createdDevice - The device already created in DB, or null.
 * @param {string} defaultElectricMeterDeviceFeatureId - Feature id of the main electric meter.
 * @returns {object} A copy of the device carrying its energy features.
 * @example
 * const device = withEnergyFeatures(publishedDevice, createdDevice, 'meter-feature-id');
 */
function withEnergyFeatures(device, createdDevice, defaultElectricMeterDeviceFeatureId) {
  const createdFeatures = (createdDevice && createdDevice.features) || [];
  const createdFeatureByExternalId = new Map(createdFeatures.map((feature) => [feature.external_id, feature]));
  const features = device.features.map((feature) => {
    const createdFeature = createdFeatureByExternalId.get(feature.external_id);
    if (!createdFeature) {
      return { ...feature };
    }
    // an already-created feature keeps the identity it has in DB: the "Update"
    // gesture posts this very object back to POST /api/v1/device, which must
    // update the existing row, not try to move its primary key
    return {
      ...feature,
      id: createdFeature.id,
      // an index the user re-attached to a sub-meter keeps its parent: the
      // derivation only falls back to the main meter when there is none
      ...(createdFeature.energy_parent_id ? { energy_parent_id: createdFeature.energy_parent_id } : {}),
    };
  });
  // the derived features live in DB only — the integration never republishes
  // them, so they are brought back before the derivation (which matches them
  // on their external_id) to be updated instead of duplicated. One whose index
  // feature disappeared from the publication is dropped along with it.
  createdFeatures.forEach((createdFeature) => {
    const derived = matchDerivedEnergyFeature(createdFeature);
    if (!derived) {
      return;
    }
    const indexStillPublished = device.features.some(
      (feature) => `${feature.external_id}${derived.suffix}` === createdFeature.external_id,
    );
    if (!indexStillPublished) {
      return;
    }
    features.push({
      id: createdFeature.id,
      external_id: createdFeature.external_id,
      name: createdFeature.name,
      category: createdFeature.category,
      type: createdFeature.type,
      unit: createdFeature.unit,
      read_only: createdFeature.read_only,
      keep_history: createdFeature.keep_history,
      has_feedback: createdFeature.has_feedback,
      min: createdFeature.min,
      max: createdFeature.max,
      ...(createdFeature.energy_parent_id ? { energy_parent_id: createdFeature.energy_parent_id } : {}),
    });
  });
  const deviceWithEnergyFeatures = addEnergyFeatures({ ...device, features }, defaultElectricMeterDeviceFeatureId);
  // the selector remains the core's business, as for every published feature
  // (see setDiscoveredDevices): addEnergyFeatures derives one from the index
  // feature's selector, which an external integration never publishes
  deviceWithEnergyFeatures.features.forEach((feature) => {
    delete feature.selector;
  });
  return deviceWithEnergyFeatures;
}

// the published STRUCTURE differs from the created device when features
// were added, removed or redefined — the Discovery screen then offers an
// explicit "Update" gesture (params alone are upserted automatically)
const featureSignature = (feature) =>
  JSON.stringify([
    feature.external_id,
    feature.category,
    feature.type,
    feature.unit || null,
    feature.min !== undefined ? feature.min : null,
    feature.max !== undefined ? feature.max : null,
    feature.step !== undefined && feature.step !== null ? feature.step : null,
  ]);

/**
 * @description Compare the features published in the discovery with the
 * ones of the created device.
 * @param {Array} publishedFeatures - Features published by the integration.
 * @param {Array} createdFeatures - Features of the created device.
 * @returns {boolean} True when the published structure differs.
 * @example
 * const changed = structureDiffers(published.features, created.features);
 */
function structureDiffers(publishedFeatures, createdFeatures) {
  const publishedSignatures = publishedFeatures.map(featureSignature).sort();
  const createdSignatures = (createdFeatures || []).map(featureSignature).sort();
  return JSON.stringify(publishedSignatures) !== JSON.stringify(createdSignatures);
}

/**
 * @description Get the in-memory list of discovered devices of an
 * integration, with the "created" flag (a device with this external_id has
 * already been created by the user) and the "structure_changed" flag (the
 * re-published features differ from the created device: the Discovery
 * screen offers an Update button). A device publishing a cumulative energy
 * index also gets its energy-tracking features (30-minutes consumption and
 * cost) added by the core.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<Array>} Resolve with the list of discovered devices.
 * @example
 * const devices = await gladys.externalIntegration.getDiscoveredDevices('ext-dev-my-integration');
 */
async function getDiscoveredDevices(selector) {
  const service = await this.getBySelector(selector);
  const devices = this.discoveredDevices.get(service.id) || [];
  // a single lookup for the whole list, and only when a device needs it
  const defaultElectricMeterDeviceFeatureId = devices.some(hasEnergyIndexFeature)
    ? await this.energyPrice.getDefaultElectricMeterFeatureId()
    : null;
  return devices.map((device) => {
    const createdDevice = this.stateManager.get('deviceByExternalId', device.external_id);
    const deviceToReturn = hasEnergyIndexFeature(device)
      ? withEnergyFeatures(device, createdDevice, defaultElectricMeterDeviceFeatureId)
      : device;
    return {
      ...deviceToReturn,
      created: createdDevice !== null,
      structure_changed: createdDevice !== null && structureDiffers(deviceToReturn.features, createdDevice.features),
    };
  });
}

module.exports = {
  getDiscoveredDevices,
};
