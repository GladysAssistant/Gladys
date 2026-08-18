const { addEnergyFeatures } = require('../../services/energy-monitoring/utils/addEnergyFeatures');
const {
  ENERGY_INDEX_FEATURE_TYPES,
  ENERGY_FROM_INDEX_KINDS,
} = require('../../services/energy-monitoring/utils/constants');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

// The two features the core derives from a cumulative meter index, with the
// deterministic `<index external_id><suffix>` naming of addEnergyFeatures.
const DERIVED_ENERGY_FEATURES = [
  { type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION, suffix: '_consumption' },
  { type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST, suffix: '_cost' },
];

// The cursors of the "index delta -> thirty-minutes state" pipelines, stored
// as device params by the core (one per kind, plus one per index feature:
// `<name>_<feature id>`). They belong to no integration and are never
// published back.
const ENERGY_PARAM_PREFIXES = Object.values(ENERGY_FROM_INDEX_KINDS).map((kind) => kind.lastProcessedParamName);

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
 * @description Tell whether a feature is a cumulative energy index the core
 * can derive energy tracking from.
 * @param {object} feature - The feature to test.
 * @returns {boolean} True when the feature is an energy index.
 * @example
 * const isIndex = isEnergyIndexFeature(feature);
 */
function isEnergyIndexFeature(feature) {
  return Boolean(
    ENERGY_INDEX_FEATURE_TYPES[feature.category] && ENERGY_INDEX_FEATURE_TYPES[feature.category].includes(feature.type),
  );
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
  return device.features.some(isEnergyIndexFeature);
}

/**
 * @description Find the still-published cumulative index a derived feature
 * already in DB hangs off. The deterministic `<index external_id><suffix>`
 * naming answers it directly for a feature the core derived itself; one an
 * integration derived on its own (what this behavior makes unnecessary) named
 * it as it wanted, and is only found back through its parent link — a
 * consumption feature hangs off the index, a cost feature off the consumption.
 * @param {object} createdFeature - The derived feature already in DB.
 * @param {object} derived - Its derived feature descriptor.
 * @param {object} lookups - The lookups shared by the whole device.
 * @param {Set} lookups.publishedIndexExternalIds - External ids of the published index features.
 * @param {Map} lookups.createdFeatureById - The features already in DB, by id.
 * @returns {object|null} The index external_id and how it was matched, if any.
 * @example
 * const match = matchPublishedIndex(createdFeature, derived, lookups);
 */
function matchPublishedIndex(createdFeature, derived, { publishedIndexExternalIds, createdFeatureById }) {
  if (createdFeature.external_id.endsWith(derived.suffix)) {
    const indexExternalId = createdFeature.external_id.slice(0, -derived.suffix.length);
    // the source feature must STILL be a cumulative index: one that changed
    // type keeps no energy tracking, its derived features are obsolete
    if (publishedIndexExternalIds.has(indexExternalId)) {
      return { indexExternalId, viaSuffix: true };
    }
  }
  const parent = createdFeatureById.get(createdFeature.energy_parent_id);
  if (!parent) {
    return null;
  }
  if (publishedIndexExternalIds.has(parent.external_id)) {
    return { indexExternalId: parent.external_id, viaSuffix: false };
  }
  const grandParent = createdFeatureById.get(parent.energy_parent_id);
  if (grandParent && publishedIndexExternalIds.has(grandParent.external_id)) {
    return { indexExternalId: grandParent.external_id, viaSuffix: false };
  }
  return null;
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
  // feature disappeared from the publication, or stopped being an index, is
  // dropped along with it.
  const lookups = {
    publishedIndexExternalIds: new Set(
      device.features.filter(isEnergyIndexFeature).map((feature) => feature.external_id),
    ),
    createdFeatureById: new Map(createdFeatures.map((createdFeature) => [createdFeature.id, createdFeature])),
  };
  const featuresToReinject = [];
  createdFeatures.forEach((createdFeature) => {
    const derived = matchDerivedEnergyFeature(createdFeature);
    if (!derived) {
      return;
    }
    const match = matchPublishedIndex(createdFeature, derived, lookups);
    if (match) {
      featuresToReinject.push({ createdFeature, derived, ...match });
    }
  });
  // a feature already carrying the deterministic name is the one to keep when
  // an integration also left a custom-named one behind for the same index
  const publishedExternalIds = new Set(features.map((feature) => feature.external_id));
  const reinjectedExternalIds = new Set();
  featuresToReinject
    .sort((a, b) => Number(b.viaSuffix) - Number(a.viaSuffix))
    .forEach(({ createdFeature, derived, indexExternalId }) => {
      // the deterministic name is what addEnergyFeatures looks for: a feature
      // an integration derived itself is re-injected UNDER THAT NAME, keeping
      // its DB id, so the "Update" renames the existing row instead of
      // replacing it — its history is kept
      const externalId = `${indexExternalId}${derived.suffix}`;
      // the integration may publish the derived features itself (which this
      // derivation makes unnecessary): the published entry already carries the
      // DB identity, re-injecting would duplicate that very row
      if (
        publishedExternalIds.has(createdFeature.external_id) ||
        publishedExternalIds.has(externalId) ||
        reinjectedExternalIds.has(externalId)
      ) {
        return;
      }
      reinjectedExternalIds.add(externalId);
      features.push({
        id: createdFeature.id,
        external_id: externalId,
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

/**
 * @description Bring back the energy-pipeline cursors stored in the params of
 * the created device. The Discovery screen posts the discovered device to
 * POST /api/v1/device, which DELETES the params missing from the payload: an
 * integration knows nothing about those cursors, so an "Update" would restart
 * the 30-minutes pipeline from scratch (skipped or rebuilt windows). The
 * published list stays untouched: the copy is returned.
 * @param {object} device - The device published by the integration.
 * @param {object} createdDevice - The device already created in DB, or null.
 * @returns {object} The device carrying the energy params already in DB.
 * @example
 * const device = withEnergyParams(publishedDevice, createdDevice);
 */
function withEnergyParams(device, createdDevice) {
  const publishedParams = device.params || [];
  const createdParams = (createdDevice && createdDevice.params) || [];
  const paramsToKeep = createdParams.filter(
    (param) =>
      typeof param.name === 'string' &&
      ENERGY_PARAM_PREFIXES.some((prefix) => param.name.startsWith(prefix)) &&
      !publishedParams.some((publishedParam) => publishedParam.name === param.name),
  );
  if (paramsToKeep.length === 0) {
    return device;
  }
  return {
    ...device,
    params: [
      ...publishedParams,
      ...paramsToKeep.map((param) => ({ id: param.id, name: param.name, value: param.value })),
    ],
  };
}

/**
 * @description Bring back the "keep history" choice the user made on the
 * features already created. `keep_history` is published by the integration
 * (it only knows a sensible default), but once the device exists it belongs
 * to the user, like the device name and its room: it is edited on the device
 * screen and must survive a re-publication. The Discovery screen posts this
 * very object back to POST /api/v1/device on the "Update" gesture, which
 * would otherwise restore the integration's value and silently start (or
 * stop) storing that feature's history again. The published list stays
 * untouched: the copy is returned.
 * @param {object} device - The device published by the integration.
 * @param {object} createdDevice - The device already created in DB, or null.
 * @returns {object} The device carrying the user's keep_history choices.
 * @example
 * const device = withUserKeepHistory(publishedDevice, createdDevice);
 */
function withUserKeepHistory(device, createdDevice) {
  const createdFeatures = (createdDevice && createdDevice.features) || [];
  if (createdFeatures.length === 0) {
    return device;
  }
  const keepHistoryByExternalId = new Map(
    createdFeatures.map((createdFeature) => [createdFeature.external_id, createdFeature.keep_history]),
  );
  return {
    ...device,
    features: device.features.map((feature) =>
      keepHistoryByExternalId.has(feature.external_id)
        ? { ...feature, keep_history: keepHistoryByExternalId.get(feature.external_id) }
        : feature,
    ),
  };
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
 * cost) added by the core. The "keep history" choice made by the user on an
 * already-created device wins over the published one.
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
    const deviceWithEnergyFeatures = hasEnergyIndexFeature(device)
      ? withEnergyFeatures(device, createdDevice, defaultElectricMeterDeviceFeatureId)
      : device;
    const deviceToReturn = withUserKeepHistory(
      withEnergyParams(deviceWithEnergyFeatures, createdDevice),
      createdDevice,
    );
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
