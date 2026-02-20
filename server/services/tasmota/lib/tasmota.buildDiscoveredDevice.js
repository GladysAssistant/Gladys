const { addEnergyFeatures } = require('../../energy-monitoring/utils/addEnergyFeatures');
const { ENERGY_INDEX_FEATURE_TYPES } = require('../../energy-monitoring/utils/constants');
const { mergeDevices, hasDeviceChanged } = require('../../../utils/device');
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

  const existingFeaturesById = new Map();
  existing.features.forEach((feature) => {
    if (feature && feature.id) {
      existingFeaturesById.set(feature.id, feature);
    }
  });

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

  const addFeatureIfMissing = (feature) => {
    const alreadyPresent = device.features.some((f) => f.external_id === feature.external_id);
    if (!alreadyPresent) {
      device.features.push(feature);
    }
  };

  const ensureParentFeature = (feature) => {
    if (!feature.energy_parent_id) {
      return true;
    }

    const parentExists = device.features.some((f) => f.id === feature.energy_parent_id);
    if (parentExists) {
      return true;
    }

    const parentFeature = existingFeaturesById.get(feature.energy_parent_id);
    if (!parentFeature) {
      return false;
    }

    const parentReady = ensureParentFeature(parentFeature);
    if (!parentReady) {
      return false;
    }

    addFeatureIfMissing(parentFeature);
    return true;
  };

  existingEnergyDerivedFeatures.forEach((feature) => {
    const parentReady = ensureParentFeature(feature);
    if (!parentReady) {
      return;
    }

    addFeatureIfMissing(feature);
  });
};

const normalizeTasmotaDerivedFeatures = (device) => {
  if (!device || !Array.isArray(device.features)) {
    return;
  }

  const featuresById = new Map();
  const featuresByExternalId = new Map();
  device.features.forEach((feature) => {
    if (feature && feature.id) {
      featuresById.set(feature.id, feature);
    }
    if (feature && feature.external_id) {
      featuresByExternalId.set(feature.external_id, feature);
    }
  });

  const isConsumption = (feature) =>
    feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
    feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION;
  const isCost = (feature) =>
    feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
    feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST;

  const findIndexFromConsumption = (feature) => {
    if (feature.energy_parent_id && featuresById.has(feature.energy_parent_id)) {
      return featuresById.get(feature.energy_parent_id);
    }
    if (feature.external_id) {
      const baseExternalId = feature.external_id.replace(/(_consumption|:consumption)$/i, '');
      return featuresByExternalId.get(baseExternalId);
    }
    return null;
  };

  const findIndexFromCost = (feature) => {
    if (feature.energy_parent_id && featuresById.has(feature.energy_parent_id)) {
      const consumption = featuresById.get(feature.energy_parent_id);
      if (consumption) {
        const indexFromConsumption = findIndexFromConsumption(consumption);
        if (indexFromConsumption) {
          return indexFromConsumption;
        }
      }
    }
    if (feature.external_id) {
      const baseExternalId = feature.external_id.replace(/(_cost|:cost)$/i, '');
      return featuresByExternalId.get(baseExternalId);
    }
    return null;
  };

  const normalizedFeatures = [];
  const seenExternalIds = new Set();

  device.features.forEach((feature) => {
    if (!feature || !feature.external_id) {
      normalizedFeatures.push(feature);
      return;
    }

    let normalizedFeature = feature;
    if (isConsumption(feature) || isCost(feature)) {
      const indexFeature = isConsumption(feature) ? findIndexFromConsumption(feature) : findIndexFromCost(feature);
      const suffix = isConsumption(feature) ? ':consumption' : ':cost';
      const selectorSuffix = isConsumption(feature) ? '-consumption' : '-cost';
      if (indexFeature && indexFeature.external_id) {
        const normalizedExternalId = `${indexFeature.external_id}${suffix}`;
        if (seenExternalIds.has(normalizedExternalId)) {
          return;
        }
        normalizedFeature = {
          ...feature,
          external_id: normalizedExternalId,
          selector: indexFeature.selector ? `${indexFeature.selector}${selectorSuffix}` : feature.selector,
        };
      } else {
        const normalizedExternalId = feature.external_id
          .replace(/_consumption$/i, ':consumption')
          .replace(/_cost$/i, ':cost');
        if (seenExternalIds.has(normalizedExternalId)) {
          return;
        }
        normalizedFeature = {
          ...feature,
          external_id: normalizedExternalId,
          selector: feature.selector
            ? feature.selector.replace(/_consumption$/i, '-consumption').replace(/_cost$/i, '-cost')
            : feature.selector,
        };
      }
    }

    if (normalizedFeature.external_id && seenExternalIds.has(normalizedFeature.external_id)) {
      return;
    }
    if (normalizedFeature.external_id) {
      seenExternalIds.add(normalizedFeature.external_id);
    }
    normalizedFeatures.push(normalizedFeature);
  });

  device.features = normalizedFeatures;
};

const buildDiscoveredDevice = (device, existing, defaultElectricMeterDeviceFeatureId) => {
  const mergedDevice = mergeDevices(device, existing);
  ensureExistingEnergyDerivedFeatures(mergedDevice, existing);

  const featuresList = Array.isArray(mergedDevice.features) ? mergedDevice.features : [];
  const isEnergyIndexFeature = (feature) =>
    ENERGY_INDEX_FEATURE_TYPES[feature.category] && ENERGY_INDEX_FEATURE_TYPES[feature.category].includes(feature.type);

  const totalIndexFeatures = featuresList.filter(
    (feature) =>
      isEnergyIndexFeature(feature) &&
      feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
      feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY &&
      isTasmotaTotalEnergyIndex(feature),
  );

  const hasConsumptionForIndex = (indexFeature) =>
    featuresList.some(
      (feature) =>
        feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION &&
        ((indexFeature.id && feature.energy_parent_id === indexFeature.id) ||
          (feature.external_id &&
            indexFeature.external_id &&
            (feature.external_id === `${indexFeature.external_id}_consumption` ||
              feature.external_id === `${indexFeature.external_id}:consumption`))),
    );

  const hasCostForConsumption = (consumptionFeature) =>
    featuresList.some(
      (feature) =>
        feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST &&
        ((consumptionFeature.id && feature.energy_parent_id === consumptionFeature.id) ||
          (feature.external_id &&
            consumptionFeature.external_id &&
            (feature.external_id === `${consumptionFeature.external_id}_cost` ||
              feature.external_id === `${consumptionFeature.external_id}:cost`))),
    );

  const indexFeaturesToProcess = totalIndexFeatures.filter((indexFeature) => {
    const hasConsumption = hasConsumptionForIndex(indexFeature);
    if (!hasConsumption) {
      return true;
    }

    const consumptionFeature = featuresList.find(
      (feature) =>
        feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION &&
        ((indexFeature.id && feature.energy_parent_id === indexFeature.id) ||
          (feature.external_id &&
            indexFeature.external_id &&
            (feature.external_id === `${indexFeature.external_id}_consumption` ||
              feature.external_id === `${indexFeature.external_id}:consumption`))),
    );
    return consumptionFeature ? !hasCostForConsumption(consumptionFeature) : true;
  });

  if (indexFeaturesToProcess.length > 0) {
    const filteredDevice = {
      ...mergedDevice,
      features: featuresList.filter(
        (feature) => !isEnergyIndexFeature(feature) || indexFeaturesToProcess.includes(feature),
      ),
    };

    addEnergyFeatures(filteredDevice, defaultElectricMeterDeviceFeatureId);

    if (filteredDevice.features !== mergedDevice.features) {
      if (!Array.isArray(mergedDevice.features)) {
        mergedDevice.features = [];
      }
      const mergedExternalIds = new Set(mergedDevice.features.map((feature) => feature.external_id));
      filteredDevice.features.forEach((feature) => {
        if (!mergedExternalIds.has(feature.external_id)) {
          mergedExternalIds.add(feature.external_id);
          mergedDevice.features.push(feature);
        }
      });
    }
  }

  normalizeTasmotaDerivedFeatures(mergedDevice);

  if (existing) {
    mergedDevice.updatable = hasDeviceChanged(
      {
        ...mergedDevice,
        features: Array.isArray(mergedDevice.features) ? mergedDevice.features : [],
        params: Array.isArray(mergedDevice.params) ? mergedDevice.params : [],
      },
      {
        ...existing,
        features: Array.isArray(existing.features) ? existing.features : [],
        params: Array.isArray(existing.params) ? existing.params : [],
      },
    );
  }

  return mergedDevice;
};

module.exports = {
  buildDiscoveredDevice,
  isTasmotaTotalEnergyIndex,
};
