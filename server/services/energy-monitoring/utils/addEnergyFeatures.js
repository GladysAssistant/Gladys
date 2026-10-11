const uuid = require('uuid');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { ENERGY_INDEX_FEATURE_TYPES } = require('./constants');

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

    // Set the default energy parent id if it's not set
    if (!indexFeature.energy_parent_id) {
      indexFeature.energy_parent_id = defaultElectricMeterDeviceFeatureId;
    }

    const consumptionFeatureExternalId = `${indexFeature.external_id}_consumption`;
    const consumptionFeature = device.features.find(
      (f) =>
        f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION &&
        f.external_id === consumptionFeatureExternalId,
    );

    let consumptionFeatureId = null;

    if (!consumptionFeature) {
      consumptionFeatureId = uuid.v4();
      featuresToAdd.push({
        id: consumptionFeatureId,
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
        energy_parent_id: indexFeature.id,
        unit: indexFeature.unit,
        keep_history: true,
        has_feedback: false,
        read_only: true,
        min: 0,
        max: 100000000000,
        external_id: consumptionFeatureExternalId,
        name: `${indexFeature.name} (consumption)`,
        selector: `${indexFeature.selector}_consumption`,
      });
    } else {
      consumptionFeatureId = consumptionFeature.id;
    }

    const costFeatureExternalId = `${indexFeature.external_id}_cost`;
    const costFeature = device.features.find(
      (f) =>
        f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST &&
        f.external_id === costFeatureExternalId,
    );

    if (!costFeature) {
      featuresToAdd.push({
        id: uuid.v4(),
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
        energy_parent_id: consumptionFeatureId,
        unit: DEVICE_FEATURE_UNITS.EURO,
        keep_history: true,
        has_feedback: false,
        read_only: true,
        min: 0,
        max: 100000000000,
        external_id: costFeatureExternalId,
        name: `${indexFeature.name} (cost)`,
        selector: `${indexFeature.selector}_cost`,
      });
    }
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
  const indexConsumptionExternalIds = new Set(indexFeatures.map((f) => `${f.external_id}_consumption`));
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
    // back to the main meter, like an index
    if (!consumptionFeature.energy_parent_id) {
      consumptionFeature.energy_parent_id = defaultElectricMeterDeviceFeatureId;
    }
    const costType = CONSUMPTION_COST_TYPES[consumptionFeature.type];
    const costFeatureExternalId = `${consumptionFeature.external_id}_cost`;
    const existingCostFeature = device.features.find(
      (f) =>
        f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        f.type === costType &&
        f.external_id === costFeatureExternalId,
    );
    if (existingCostFeature) {
      return;
    }
    featuresToAdd.push({
      id: uuid.v4(),
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: costType,
      energy_parent_id: consumptionFeature.id,
      unit: DEVICE_FEATURE_UNITS.EURO,
      keep_history: true,
      has_feedback: false,
      read_only: true,
      min: 0,
      max: 100000000000,
      external_id: costFeatureExternalId,
      name: `${consumptionFeature.name} (cost)`,
      ...(consumptionFeature.selector ? { selector: `${consumptionFeature.selector}_cost` } : {}),
    });
  });

  device.features = [...device.features, ...featuresToAdd];

  return device;
};

module.exports = {
  addEnergyFeatures,
  addConsumptionCostFeatures,
  isConsumptionFeature,
  CONSUMPTION_COST_TYPES,
};
