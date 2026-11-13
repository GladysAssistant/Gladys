const { expect } = require('chai');
const { addProductionFeatures } = require('../../../../services/energy-monitoring/utils/addEnergyFeatures');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

describe('addProductionFeatures', () => {
  const productionIndex = () => ({
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX,
    external_id: 'device:produced_energy',
    name: 'Produced energy',
    selector: 'device-produced-energy',
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  });

  it('should add a thirty-minutes production feature hanging off the production index', () => {
    const device = { features: [productionIndex()] };

    const result = addProductionFeatures(device);

    expect(result.features).to.have.lengthOf(2);
    const [index, production] = result.features;
    expect(index.id).to.be.a('string');
    // production is never attached to the main electric meter
    expect(index.energy_parent_id).to.equal(undefined);
    expect(production).to.deep.include({
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION,
      energy_parent_id: index.id,
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
      keep_history: true,
      read_only: true,
      external_id: 'device:produced_energy_production',
      name: 'Produced energy (production)',
      selector: 'device-produced-energy_production',
    });
  });

  it('should keep an existing production feature', () => {
    const device = {
      features: [
        { ...productionIndex(), id: 'index-id' },
        {
          id: 'production-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION,
          external_id: 'device:produced_energy_production',
          energy_parent_id: 'index-id',
        },
      ],
    };

    const result = addProductionFeatures(device);

    expect(result.features.map((f) => f.id)).to.deep.equal(['index-id', 'production-id']);
  });

  it('should not derive anything from a consumption index', () => {
    const device = {
      features: [
        {
          id: 'energy-id',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
          external_id: 'device:energy',
        },
      ],
    };

    const result = addProductionFeatures(device);

    expect(result.features).to.have.lengthOf(1);
  });
});
