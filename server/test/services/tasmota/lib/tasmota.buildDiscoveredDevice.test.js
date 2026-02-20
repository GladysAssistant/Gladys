const { expect } = require('chai');

const { buildDiscoveredDevice } = require('../../../../services/tasmota/lib/tasmota.buildDiscoveredDevice');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

describe('Tasmota - buildDiscoveredDevice', () => {
  const defaultElectricMeterDeviceFeatureId = 'default-energy-feature-id';

  it('returns device unchanged when no existing and no energy index', () => {
    const device = { external_id: 'tasmota:device-1', features: [] };
    const result = buildDiscoveredDevice(device, undefined, defaultElectricMeterDeviceFeatureId);
    expect(result.features).to.have.lengthOf(0);
    expect(result.updatable).to.not.equal(true);
  });

  it('re-injects derived energy features when device.features is missing', () => {
    const existing = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'tasmota:device-1:ENERGY:Total:cost',
          energy_parent_id: 'consumption-id',
        },
      ],
    };
    const device = { external_id: 'tasmota:device-1' };
    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);
    expect(result.features.find((f) => f.external_id.endsWith(':consumption'))).to.not.equal(undefined);
    expect(result.features.find((f) => f.external_id.endsWith(':cost'))).to.not.equal(undefined);
  });

  it('does not re-inject derived features when parent is missing', () => {
    const existing = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'tasmota:device-1:ENERGY:Total:cost',
          energy_parent_id: 'consumption-id',
        },
      ],
    };
    const device = { external_id: 'tasmota:device-1' };
    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);
    const hasConsumption = result.features.some((f) => f.external_id.endsWith(':consumption'));
    const hasCost = result.features.some((f) => f.external_id.endsWith(':cost'));
    expect(hasConsumption).to.equal(false);
    expect(hasCost).to.equal(false);
  });

  it('does not duplicate derived energy features already present', () => {
    const existing = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
      ],
    };
    const device = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
      ],
    };
    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);
    const consumptionFeatures = result.features.filter((f) => f.external_id.endsWith(':consumption'));
    expect(consumptionFeatures).to.have.lengthOf(1);
  });

  it('marks device updatable when energy features are added for existing device', () => {
    const existing = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
      ],
    };
    const device = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
      ],
    };
    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);
    const hasConsumption = result.features.some((f) => f.external_id.endsWith(':consumption'));
    const hasCost = result.features.some((f) => f.external_id.endsWith(':cost'));
    expect(hasConsumption).to.equal(true);
    expect(hasCost).to.equal(true);
    expect(result.updatable).to.equal(true);
  });

  it('keeps device not updatable when no change is detected', () => {
    const existing = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'tasmota:device-1:ENERGY:Total:cost',
          energy_parent_id: 'consumption-id',
        },
      ],
    };
    const device = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'tasmota:device-1:ENERGY:Total:cost',
          energy_parent_id: 'consumption-id',
        },
      ],
    };
    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);
    expect(result.updatable).to.equal(false);
  });

  it('normalizes derived features to ":" format and keeps device not updatable', () => {
    const existing = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'tasmota:device-1:ENERGY:Total:cost',
          energy_parent_id: 'consumption-id',
        },
      ],
    };
    const device = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
      ],
    };

    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);

    const externalIds = result.features.map((f) => f.external_id);
    expect(externalIds).to.include('tasmota:device-1:ENERGY:Total:consumption');
    expect(externalIds).to.include('tasmota:device-1:ENERGY:Total:cost');
    expect(externalIds.some((id) => id.endsWith('_consumption'))).to.equal(false);
    expect(externalIds.some((id) => id.endsWith('_cost'))).to.equal(false);
    expect(result.updatable).to.equal(false);
  });
});
