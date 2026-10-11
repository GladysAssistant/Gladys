const { expect } = require('chai');
const {
  addConsumptionCostFeatures,
  isConsumptionFeature,
} = require('../../../../services/energy-monitoring/utils/addEnergyFeatures');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const DEFAULT_METER_FEATURE_ID = 'default-meter-feature-id';

const buildConsumptionFeature = (overrides = {}) => ({
  category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  external_id: 'hq:meter:consumption',
  name: 'Consommation',
  unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  ...overrides,
});

describe('addConsumptionCostFeatures', () => {
  it('should add the cost feature of a 30-minutes consumption and attach it to the main meter', () => {
    const device = { features: [buildConsumptionFeature({ selector: 'hq-meter-consumption' })] };
    const result = addConsumptionCostFeatures(device, DEFAULT_METER_FEATURE_ID);
    expect(result.features).to.have.lengthOf(2);
    const [consumption, cost] = result.features;
    expect(consumption.id).to.be.a('string');
    expect(consumption.energy_parent_id).to.equal(DEFAULT_METER_FEATURE_ID);
    expect(cost).to.deep.include({
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
      energy_parent_id: consumption.id,
      unit: DEVICE_FEATURE_UNITS.EURO,
      external_id: 'hq:meter:consumption_cost',
      name: 'Consommation (cost)',
      selector: 'hq-meter-consumption_cost',
      keep_history: true,
      read_only: true,
    });
  });

  it('should derive a daily cost from a daily consumption, without a selector when the source has none', () => {
    const device = {
      features: [
        buildConsumptionFeature({
          id: 'daily-id',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
          external_id: 'hq:meter:daily',
        }),
      ],
    };
    const result = addConsumptionCostFeatures(device, null);
    expect(result.features).to.have.lengthOf(2);
    expect(result.features[0].id).to.equal('daily-id');
    expect(result.features[0].energy_parent_id).to.equal(null);
    expect(result.features[1]).to.deep.include({
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
      energy_parent_id: 'daily-id',
      external_id: 'hq:meter:daily_cost',
    });
    expect(result.features[1]).to.not.have.property('selector');
  });

  it('should keep the parent the user chose and never duplicate an existing cost feature', () => {
    const device = {
      features: [
        buildConsumptionFeature({ id: 'consumption-id', energy_parent_id: 'sub-meter-feature-id' }),
        {
          id: 'cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'hq:meter:consumption_cost',
          energy_parent_id: 'consumption-id',
        },
      ],
    };
    const result = addConsumptionCostFeatures(device, DEFAULT_METER_FEATURE_ID);
    expect(result.features).to.have.lengthOf(2);
    expect(result.features[0].energy_parent_id).to.equal('sub-meter-feature-id');
  });

  it('should leave the consumption derived from an index of the same device to the index pipeline', () => {
    const index = {
      id: 'index-id',
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
      external_id: 'hq:meter:index',
    };
    const device = {
      features: [
        index,
        // hanging off the index
        buildConsumptionFeature({ external_id: 'custom-name', energy_parent_id: 'index-id' }),
        // carrying the deterministic name of addEnergyFeatures, not linked yet
        buildConsumptionFeature({ external_id: 'hq:meter:index_consumption' }),
      ],
    };
    const result = addConsumptionCostFeatures(device, DEFAULT_METER_FEATURE_ID);
    expect(result.features).to.have.lengthOf(3);
  });

  it('should tell a consumption feature from the others', () => {
    expect(isConsumptionFeature(buildConsumptionFeature())).to.equal(true);
    expect(
      isConsumptionFeature(buildConsumptionFeature({ type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION })),
    ).to.equal(true);
    expect(isConsumptionFeature(buildConsumptionFeature({ type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX }))).to.equal(
      false,
    );
    expect(
      isConsumptionFeature(buildConsumptionFeature({ category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR })),
    ).to.equal(false);
  });
});
