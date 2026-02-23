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

    const consumptionFeature = device.features.find(
      (f) =>
        f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION &&
        f.energy_parent_id &&
        f.energy_parent_id === indexFeature.id,
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
        external_id: `${indexFeature.external_id}_consumption`,
        name: `${indexFeature.name} (consumption)`,
        selector: `${indexFeature.selector}_consumption`,
      });
    } else {
      consumptionFeatureId = consumptionFeature.id;
    }

    const costFeature = device.features.find(
      (f) =>
        f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST &&
        f.energy_parent_id &&
        f.energy_parent_id === consumptionFeatureId,
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
        external_id: `${indexFeature.external_id}_cost`,
        name: `${indexFeature.name} (cost)`,
        selector: `${indexFeature.selector}_cost`,
      });
    }
  });

  device.features = [...device.features, ...featuresToAdd];

  return device;
};

module.exports = {
  addEnergyFeatures,
};
