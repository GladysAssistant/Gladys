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

  it('returns when existing features are not an array', () => {
    const existing = {
      external_id: 'tasmota:device-1',
      features: null,
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

    expect(result.features.some((f) => f.external_id.endsWith(':consumption'))).to.equal(true);
  });
  it('initializes device.features when missing and re-injects parents', () => {
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

    const externalIds = result.features.map((f) => f.external_id);
    expect(externalIds).to.include('tasmota:device-1:ENERGY:Total');
    expect(externalIds).to.include('tasmota:device-1:ENERGY:Total:consumption');
    expect(externalIds).to.include('tasmota:device-1:ENERGY:Total:cost');
  });

  it('uses existing parent already in device features', () => {
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

  it('normalizes derived features and skips duplicates without external_id', () => {
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
          selector: undefined,
        },
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total_consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'tasmota:device-1:ENERGY:Total_cost',
          energy_parent_id: 'consumption-id',
        },
        {
          id: 'duplicate-consumption',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'no-external-id',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
        {
          id: 'duplicate-switch-1',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'tasmota:device-1:SWITCH:1',
        },
        {
          id: 'duplicate-switch-2',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'tasmota:device-1:SWITCH:1',
        },
      ],
    };

    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);

    const externalIds = result.features.map((f) => f.external_id);
    const normalizedConsumption = externalIds.filter((id) => id === 'tasmota:device-1:ENERGY:Total:consumption');
    const normalizedCost = externalIds.filter((id) => id === 'tasmota:device-1:ENERGY:Total:cost');
    expect(normalizedConsumption).to.have.lengthOf(1);
    expect(normalizedCost).to.have.lengthOf(1);
    expect(result.features.some((f) => f.id === 'no-external-id')).to.equal(true);
    const duplicateSwitches = result.features.filter((f) => f.external_id === 'tasmota:device-1:SWITCH:1');
    expect(duplicateSwitches).to.have.lengthOf(1);
  });

  it('normalizes derived features without parent or external id match', () => {
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
        {
          id: 'consumption-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'custom-consumption',
          energy_parent_id: 'unknown-parent',
        },
        {
          id: 'duplicate-custom-consumption',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'custom-consumption',
          energy_parent_id: 'unknown-parent',
        },
      ],
    };

    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);

    const externalIds = result.features.map((f) => f.external_id);
    expect(externalIds).to.include('custom-consumption');
  });

  it('normalizes derived features using cost external id when parent is missing', () => {
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
        {
          id: 'cost-id',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'tasmota:device-1:ENERGY:Total_cost',
        },
      ],
    };

    const result = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);

    const externalIds = result.features.map((f) => f.external_id);
    expect(externalIds).to.include('tasmota:device-1:ENERGY:Total:cost');
  });

  it('merges derived features when mergedDevice.features is not an array', () => {
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

    expect(Array.isArray(result.features)).to.equal(true);
    expect(result.features.some((f) => f.external_id.endsWith(':consumption'))).to.equal(true);
    expect(result.features.some((f) => f.external_id.endsWith(':cost'))).to.equal(true);
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
