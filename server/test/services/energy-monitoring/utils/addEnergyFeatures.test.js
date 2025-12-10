const { expect } = require('chai');
const { addEnergyFeatures } = require('../../../../services/energy-monitoring/utils/addEnergyFeatures');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

describe('addEnergyFeatures', () => {
  const defaultElectricMeterDeviceFeatureId = 'default-meter-feature-id';

  it('should add consumption and cost features for an energy index feature', () => {
    const device = {
      features: [
        {
          id: 'index-feature-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          external_id: 'device:energy-index',
          name: 'Energy Index',
          selector: 'device-energy-index',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should have 3 features: original index + consumption + cost
    expect(result.features).to.have.lengthOf(3);

    // Check original feature has energy_parent_id set
    expect(result.features[0].energy_parent_id).to.equal(defaultElectricMeterDeviceFeatureId);

    // Check consumption feature
    const consumptionFeature = result.features.find(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    );
    expect(consumptionFeature).to.not.equal(undefined);
    expect(consumptionFeature.category).to.equal(DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR);
    expect(consumptionFeature.energy_parent_id).to.equal('index-feature-id');
    expect(consumptionFeature.external_id).to.equal('device:energy-index_consumption');
    expect(consumptionFeature.name).to.equal('Energy Index (consumption)');
    expect(consumptionFeature.selector).to.equal('device-energy-index_consumption');
    expect(consumptionFeature.unit).to.equal(DEVICE_FEATURE_UNITS.KILOWATT_HOUR);
    expect(consumptionFeature.keep_history).to.equal(true);
    expect(consumptionFeature.has_feedback).to.equal(false);
    expect(consumptionFeature.read_only).to.equal(true);
    expect(consumptionFeature.min).to.equal(0);
    expect(consumptionFeature.max).to.equal(100000000000);
    expect(consumptionFeature.id).to.be.a('string');

    // Check cost feature
    const costFeature = result.features.find(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    );
    expect(costFeature).to.not.equal(undefined);
    expect(costFeature.category).to.equal(DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR);
    expect(costFeature.energy_parent_id).to.equal(consumptionFeature.id);
    expect(costFeature.external_id).to.equal('device:energy-index_cost');
    expect(costFeature.name).to.equal('Energy Index (cost)');
    expect(costFeature.selector).to.equal('device-energy-index_cost');
    expect(costFeature.unit).to.equal(DEVICE_FEATURE_UNITS.EURO);
    expect(costFeature.keep_history).to.equal(true);
    expect(costFeature.has_feedback).to.equal(false);
    expect(costFeature.read_only).to.equal(true);
    expect(costFeature.min).to.equal(0);
    expect(costFeature.max).to.equal(100000000000);
    expect(costFeature.id).to.be.a('string');
  });

  it('should add consumption and cost features for a switch energy feature', () => {
    const device = {
      features: [
        {
          id: 'switch-energy-id',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
          external_id: 'switch:energy',
          name: 'Switch Energy',
          selector: 'switch-energy',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should have 3 features: original switch + consumption + cost
    expect(result.features).to.have.lengthOf(3);

    // Check original feature has energy_parent_id set
    expect(result.features[0].energy_parent_id).to.equal(defaultElectricMeterDeviceFeatureId);

    // Check consumption and cost features exist
    const consumptionFeature = result.features.find(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    );
    const costFeature = result.features.find(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    );
    expect(consumptionFeature).to.not.equal(undefined);
    expect(costFeature).to.not.equal(undefined);
  });

  it('should not add consumption feature if it already exists', () => {
    const device = {
      features: [
        {
          id: 'index-feature-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          external_id: 'device:energy-index',
          name: 'Energy Index',
          selector: 'device-energy-index',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
        {
          id: 'existing-consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: 'index-feature-id',
          external_id: 'device:energy-consumption',
          name: 'Existing Consumption',
          selector: 'device-energy-consumption',
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should have 3 features: index + existing consumption + new cost
    expect(result.features).to.have.lengthOf(3);

    // Check that consumption feature was not duplicated
    const consumptionFeatures = result.features.filter(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    );
    expect(consumptionFeatures).to.have.lengthOf(1);
    expect(consumptionFeatures[0].id).to.equal('existing-consumption-id');

    // Check cost feature links to existing consumption
    const costFeature = result.features.find(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    );
    expect(costFeature).to.not.equal(undefined);
    expect(costFeature.energy_parent_id).to.equal('existing-consumption-id');
  });

  it('should not add cost feature if it already exists', () => {
    const device = {
      features: [
        {
          id: 'index-feature-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          external_id: 'device:energy-index',
          name: 'Energy Index',
          selector: 'device-energy-index',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: 'index-feature-id',
          external_id: 'device:energy-consumption',
          name: 'Consumption',
          selector: 'device-energy-consumption',
        },
        {
          id: 'existing-cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          energy_parent_id: 'consumption-id',
          external_id: 'device:energy-cost',
          name: 'Existing Cost',
          selector: 'device-energy-cost',
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should have 3 features: index + consumption + existing cost (no new features added)
    expect(result.features).to.have.lengthOf(3);

    // Check that cost feature was not duplicated
    const costFeatures = result.features.filter(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    );
    expect(costFeatures).to.have.lengthOf(1);
    expect(costFeatures[0].id).to.equal('existing-cost-id');
  });

  it('should handle multiple index features', () => {
    const device = {
      features: [
        {
          id: 'index-1-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          external_id: 'device:index-1',
          name: 'Index 1',
          selector: 'device-index-1',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
        {
          id: 'index-2-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'device:index-2',
          name: 'Index 2',
          selector: 'device-index-2',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should have 6 features: 2 index + 2 consumption + 2 cost
    expect(result.features).to.have.lengthOf(6);

    // Check that both index features have consumption and cost
    const consumptionFeatures = result.features.filter(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    );
    const costFeatures = result.features.filter(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    );
    expect(consumptionFeatures).to.have.lengthOf(2);
    expect(costFeatures).to.have.lengthOf(2);
  });

  it('should not modify device without energy index features', () => {
    const device = {
      features: [
        {
          id: 'temperature-id',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          external_id: 'device:temperature',
          name: 'Temperature',
          selector: 'device-temperature',
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should have only the original feature
    expect(result.features).to.have.lengthOf(1);
    expect(result.features[0].id).to.equal('temperature-id');
  });

  it('should generate UUID for index feature without id', () => {
    const device = {
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          external_id: 'device:energy-index',
          name: 'Energy Index',
          selector: 'device-energy-index',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Check that id was generated
    expect(result.features[0].id).to.be.a('string');
    expect(result.features[0].id).to.have.lengthOf(36); // UUID format

    // Check that consumption feature references the generated id
    const consumptionFeature = result.features.find(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    );
    expect(consumptionFeature.energy_parent_id).to.equal(result.features[0].id);
  });

  it('should not set energy_parent_id if index feature already has one', () => {
    const customParentId = 'custom-parent-id';
    const device = {
      features: [
        {
          id: 'index-feature-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          external_id: 'device:energy-index',
          name: 'Energy Index',
          selector: 'device-energy-index',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
          energy_parent_id: customParentId,
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should keep the custom parent id
    expect(result.features[0].energy_parent_id).to.equal(customParentId);
  });

  it('should handle device with empty features array', () => {
    const device = {
      features: [],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should still have empty features array
    expect(result.features).to.have.lengthOf(0);
  });

  it('should preserve original device features order', () => {
    const device = {
      features: [
        {
          id: 'other-feature-1',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          external_id: 'device:temp',
          name: 'Temperature',
          selector: 'device-temp',
        },
        {
          id: 'index-feature-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          external_id: 'device:energy-index',
          name: 'Energy Index',
          selector: 'device-energy-index',
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
        {
          id: 'other-feature-2',
          category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          external_id: 'device:humidity',
          name: 'Humidity',
          selector: 'device-humidity',
        },
      ],
    };

    const result = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);

    // Should have 5 features: 3 original + consumption + cost
    expect(result.features).to.have.lengthOf(5);

    // Check that original features are in the same order
    expect(result.features[0].id).to.equal('other-feature-1');
    expect(result.features[1].id).to.equal('index-feature-id');
    expect(result.features[2].id).to.equal('other-feature-2');

    // New features should be at the end
    expect(result.features[3].type).to.equal(DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION);
    expect(result.features[4].type).to.equal(DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST);
  });
});
