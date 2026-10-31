const uuid = require('uuid');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { ENERGY_INDEX_FEATURE_TYPES, PRODUCTION_INDEX_FEATURE_TYPES, ENERGY_FROM_INDEX_KINDS } = require('./constants');

// The deterministic naming of the features derived from a source feature: `<index>_consumption`
// and `<index>_cost` for an index, `<consumption>_cost` for a consumption fed by a service,
// `<production index>_production` for a production index.
const DERIVED_CONSUMPTION_SUFFIX = '_consumption';
const DERIVED_COST_SUFFIX = '_cost';
const DERIVED_PRODUCTION_SUFFIX = '_production';

// The features the core derives from a cumulative index, never published by an integration: the
// target of each "index delta -> thirty-minutes state" pipeline, and the cost of the consumption.
const DERIVED_ENERGY_FEATURE_TYPES = [
  ...Object.values(ENERGY_FROM_INDEX_KINDS).map((kind) => ({
    category: kind.targetFeatureCategory,
    type: kind.targetFeatureType,
  })),
  {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
  },
];

/**
 * @description Tell whether a feature is one the core derives from a cumulative index (30-minute
 * consumption, its cost, 30-minute production): an integration never publishes it, so a
 * rediscovery must keep it.
 * @param {object} feature - The feature to test.
 * @returns {boolean} True for a derived energy feature.
 * @example
 * isDerivedEnergyFeature({ category: 'energy-sensor', type: 'thirty-minutes-consumption' }); // true
 */
const isDerivedEnergyFeature = (feature) =>
  DERIVED_ENERGY_FEATURE_TYPES.some(
    (derived) => derived.category === feature.category && derived.type === feature.type,
  );

/**
 * @description Find a derived feature of a device by its category, type and deterministic
 * external_id.
 * @param {object} device - The device, its features included.
 * @param {string} category - The category of the derived feature.
 * @param {string} type - The type of the derived feature.
 * @param {string} externalId - The external_id of the derived feature.
 * @returns {object|undefined} The derived feature, if the device already has it.
 * @example
 * findDerivedFeature(device, 'energy-sensor', 'thirty-minutes-consumption', 'plug:energy_consumption');
 */
const findDerivedFeature = (device, category, type, externalId) =>
  device.features.find((f) => f.category === category && f.type === type && f.external_id === externalId);

/**
 * @description Build a feature the core derives from a source feature: read-only, historized,
 * named after its source (`<source external_id><suffix>`, `<source selector><suffix>` when the
 * source has a selector, `<source name> (<label>)`).
 * @param {object} source - The feature the derived feature is named after.
 * @param {object} derivation - What to derive.
 * @param {string} derivation.category - Its category.
 * @param {string} derivation.type - Its type.
 * @param {string} derivation.suffix - The suffix of its external_id and selector.
 * @param {string} derivation.unit - Its unit.
 * @param {string} derivation.label - The label appended to its name.
 * @param {string} [derivation.parentId] - Its parent, the source by default.
 * @returns {object} The derived feature, with a new id.
 * @example
 * buildDerivedFeature(index, { category, type, suffix: '_consumption', unit, label: 'consumption' });
 */
const buildDerivedFeature = (source, { category, type, suffix, unit, label, parentId = source.id }) => ({
  id: uuid.v4(),
  category,
  type,
  energy_parent_id: parentId,
  unit,
  keep_history: true,
  has_feedback: false,
  read_only: true,
  min: 0,
  max: 100000000000,
  external_id: `${source.external_id}${suffix}`,
  name: `${source.name} (${label})`,
  ...(source.selector ? { selector: `${source.selector}${suffix}` } : {}),
});

const addEnergyFeatures = (device, defaultElectricMeterDeviceFeatureId) => {
  const featuresToAdd = [];
  const indexFeatures = device.features.filter(
    (f) => ENERGY_INDEX_FEATURE_TYPES[f.category] && ENERGY_INDEX_FEATURE_TYPES[f.category].includes(f.type),
  );

  indexFeatures.forEach((indexFeature) => {
    // Set the default id if it's not set
    if (!indexFeature.id) {
      indexFeature.id = uuid.v4();
    }

    // Set the default energy parent id if it's not set (the main meter's own feature
    // stays a root: attached to itself, the hierarchy would be circular)
    if (!indexFeature.energy_parent_id && indexFeature.id !== defaultElectricMeterDeviceFeatureId) {
      indexFeature.energy_parent_id = defaultElectricMeterDeviceFeatureId;
    }

    let consumptionFeature = findDerivedFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      `${indexFeature.external_id}${DERIVED_CONSUMPTION_SUFFIX}`,
    );
    if (!consumptionFeature) {
      consumptionFeature = buildDerivedFeature(indexFeature, {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
        suffix: DERIVED_CONSUMPTION_SUFFIX,
        unit: indexFeature.unit,
        label: 'consumption',
      });
      featuresToAdd.push(consumptionFeature);
    }

    const costFeature = findDerivedFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
      `${indexFeature.external_id}${DERIVED_COST_SUFFIX}`,
    );
    if (!costFeature) {
      featuresToAdd.push(
        buildDerivedFeature(indexFeature, {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          suffix: DERIVED_COST_SUFFIX,
          unit: DEVICE_FEATURE_UNITS.EURO,
          label: 'cost',
          parentId: consumptionFeature.id,
        }),
      );
    }
  });

  device.features = [...device.features, ...featuresToAdd];

  return device;
};

/**
 * @description Add the 30-minute production feature of every production index of a device
 * (PRODUCTION_INDEX_FEATURE_TYPES): a `<index external_id>_production` feature hanging off the
 * index (`energy_parent_id`), which the production job fills from the index deltas. The production
 * index is never attached to the main electric meter: production is not priced by a consumption
 * contract. Idempotent: an existing production feature (matched on its external_id) is kept.
 * @param {object} device - The device, its features included.
 * @returns {object} The device, with its production features added.
 * @example
 * addProductionFeatures(device);
 */
const addProductionFeatures = (device) => {
  const featuresToAdd = [];
  device.features
    .filter(
      (f) => PRODUCTION_INDEX_FEATURE_TYPES[f.category] && PRODUCTION_INDEX_FEATURE_TYPES[f.category].includes(f.type),
    )
    .forEach((indexFeature) => {
      if (!indexFeature.id) {
        indexFeature.id = uuid.v4();
      }
      const productionFeature = findDerivedFeature(
        device,
        DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
        DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION,
        `${indexFeature.external_id}${DERIVED_PRODUCTION_SUFFIX}`,
      );
      if (productionFeature) {
        return;
      }
      featuresToAdd.push(
        buildDerivedFeature(indexFeature, {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION,
          suffix: DERIVED_PRODUCTION_SUFFIX,
          unit: indexFeature.unit,
          label: 'production',
        }),
      );
    });

  device.features = [...device.features, ...featuresToAdd];

  return device;
};

// A consumption feature a service feeds itself with dated states (a supplier whose data
// arrives after the fact, like Enedis) and the cost feature the core derives from it.
const CONSUMPTION_COST_TYPES = {
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION]:
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
  [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION]: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
};

/**
 * @description Tell whether a feature is a consumption feature a service feeds itself
 * (30-minute or daily consumption of the energy-sensor category), as opposed to one derived
 * from a cumulative index.
 * @param {object} feature - The feature to test.
 * @returns {boolean} True for a 30-minute or daily consumption feature.
 * @example
 * isConsumptionFeature(feature);
 */
const isConsumptionFeature = (feature) =>
  feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR && CONSUMPTION_COST_TYPES[feature.type] !== undefined;

/**
 * @description Add the cost feature of every consumption feature of a device that is not
 * derived from a cumulative index of the same device (those get theirs from addEnergyFeatures):
 * a `<consumption external_id>_cost` feature hanging off the consumption (`energy_parent_id`),
 * 30-minute or daily like its source. The consumption feature itself is attached to the main
 * electric meter when it has no parent yet, like an index. Idempotent: an existing cost feature
 * (matched on its external_id) is kept.
 * @param {object} device - The device, its features included.
 * @param {string|null} defaultElectricMeterDeviceFeatureId - Feature id of the main electric meter.
 * @returns {object} The device, with its cost features added.
 * @example
 * addConsumptionCostFeatures(device, defaultElectricMeterDeviceFeatureId);
 */
const addConsumptionCostFeatures = (device, defaultElectricMeterDeviceFeatureId) => {
  const indexFeatures = device.features.filter(
    (f) => ENERGY_INDEX_FEATURE_TYPES[f.category] && ENERGY_INDEX_FEATURE_TYPES[f.category].includes(f.type),
  );
  const indexFeatureIds = new Set(indexFeatures.map((f) => f.id));
  const indexConsumptionExternalIds = new Set(
    indexFeatures.map((f) => `${f.external_id}${DERIVED_CONSUMPTION_SUFFIX}`),
  );
  const featuresToAdd = [];
  device.features.filter(isConsumptionFeature).forEach((consumptionFeature) => {
    // a consumption hanging off an index of the same device, or carrying the name
    // addEnergyFeatures derives from one, is the index pipeline's
    if (
      indexFeatureIds.has(consumptionFeature.energy_parent_id) ||
      indexConsumptionExternalIds.has(consumptionFeature.external_id)
    ) {
      return;
    }
    if (!consumptionFeature.id) {
      consumptionFeature.id = uuid.v4();
    }
    // a parent the user or the integration chose (a sub-meter) is kept, an absent one falls
    // back to the main meter, like an index; the main meter's own feature (a supplier meter
    // the contract is attached to) stays a root: attached to itself, the hierarchy would be
    // circular and its costs never computed
    if (!consumptionFeature.energy_parent_id && consumptionFeature.id !== defaultElectricMeterDeviceFeatureId) {
      consumptionFeature.energy_parent_id = defaultElectricMeterDeviceFeatureId;
    }
    const costType = CONSUMPTION_COST_TYPES[consumptionFeature.type];
    const existingCostFeature = findDerivedFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      costType,
      `${consumptionFeature.external_id}${DERIVED_COST_SUFFIX}`,
    );
    if (existingCostFeature) {
      return;
    }
    featuresToAdd.push(
      buildDerivedFeature(consumptionFeature, {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: costType,
        suffix: DERIVED_COST_SUFFIX,
        unit: DEVICE_FEATURE_UNITS.EURO,
        label: 'cost',
      }),
    );
  });

  device.features = [...device.features, ...featuresToAdd];

  return device;
};

module.exports = {
  addEnergyFeatures,
  addProductionFeatures,
  addConsumptionCostFeatures,
  isConsumptionFeature,
  isDerivedEnergyFeature,
  CONSUMPTION_COST_TYPES,
  DERIVED_CONSUMPTION_SUFFIX,
  DERIVED_COST_SUFFIX,
  DERIVED_PRODUCTION_SUFFIX,
};
