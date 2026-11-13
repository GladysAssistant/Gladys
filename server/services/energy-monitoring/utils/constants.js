const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const ENERGY_INDEX_FEATURE_TYPES = {
  [DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR]: [
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
  ],
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.ENERGY],
  [DEVICE_FEATURE_CATEGORIES.TELEINFORMATION]: [
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09,
    DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10,
  ],
};

// Cumulative production meter indexes: their deltas are turned into
// THIRTY_MINUTES_PRODUCTION states (production is tracked separately from
// consumption so a solar meter is never counted as a consumer).
const PRODUCTION_INDEX_FEATURE_TYPES = {
  [DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR]: [DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX],
};

// The two "index delta -> thirty-minutes state" pipelines share the same
// implementation (energy-monitoring.calculateEnergyFromIndex*), parameterized
// by these kinds. Each kind uses its own last-processed device param so a
// device carrying both a consumption and a production index never corrupts
// the other pipeline's cursor.
const ENERGY_FROM_INDEX_KINDS = {
  CONSUMPTION: {
    name: 'consumption',
    indexFeatureTypes: ENERGY_INDEX_FEATURE_TYPES,
    targetFeatureCategory: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    targetFeatureType: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    lastProcessedParamName: 'ENERGY_INDEX_LAST_PROCESSED',
    calculateFromIndexMethod: 'calculateConsumptionFromIndex',
  },
  PRODUCTION: {
    name: 'production',
    indexFeatureTypes: PRODUCTION_INDEX_FEATURE_TYPES,
    targetFeatureCategory: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    targetFeatureType: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION,
    lastProcessedParamName: 'ENERGY_PRODUCTION_INDEX_LAST_PROCESSED',
    calculateFromIndexMethod: 'calculateProductionFromIndex',
  },
};

/**
 * @description Tell whether a feature is one Gladys derives from a cumulative index (the
 * 30-minute consumption or production of ENERGY_FROM_INDEX_KINDS, the cost of a consumption):
 * no integration publishes it, so a rediscovery must keep it.
 * @param {object} feature - The feature to test.
 * @returns {boolean} True for a derived energy feature.
 * @example
 * isDerivedEnergyFeature({ category: 'energy-sensor', type: 'thirty-minutes-consumption-cost' }); // true
 */
const isDerivedEnergyFeature = (feature) =>
  (feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
    feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST) ||
  Object.values(ENERGY_FROM_INDEX_KINDS).some(
    (kind) => feature.category === kind.targetFeatureCategory && feature.type === kind.targetFeatureType,
  );

module.exports = {
  ENERGY_INDEX_FEATURE_TYPES,
  PRODUCTION_INDEX_FEATURE_TYPES,
  ENERGY_FROM_INDEX_KINDS,
  isDerivedEnergyFeature,
};
