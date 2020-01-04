const { expect } = require('chai');

const models = require('../../../../services/tasmota/models');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const modelId = 45;

describe('TasmotaService - Model - Blitzwolf SHP', () => {
  it('get model for Blitzwolf SHP', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('blitzwolf-shp');
  });

  it('get label for Blitzwolf SHP', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Blitzwolf SHP');
  });

  it('get features for Blitzwolf SHP', () => {
    const features = models[modelId].getFeatures('device_external_id');

    expect(features).to.deep.eq([
      {
        name: 'Switch',
        external_id: 'device_external_id:switch:binary',
        selector: 'device-external-id-switch-binary',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'Voltage',
        external_id: 'device_external_id:switch:voltage',
        selector: 'device-external-id-switch-voltage',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 10000,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
      {
        name: 'Energy',
        external_id: 'device_external_id:switch:energy',
        selector: 'device-external-id-switch-energy',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 10000,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
      {
        name: 'Power',
        external_id: 'device_external_id:switch:power',
        selector: 'device-external-id-switch-power',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 10000,
        unit: DEVICE_FEATURE_UNITS.KILOWATT,
      },
    ]);
  });
});
