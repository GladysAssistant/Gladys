const { expect } = require('chai');

const models = require('../../../../services/tasmota/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 23;

describe('TasmotaService - Model - Sonoff 4CH Pro Pro', () => {
  it('get model for Sonoff 4CH Pro', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-4ch-pro');
  });

  it('get label for Sonoff 4CH Pro', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff 4CH Pro');
  });

  it('get features for Sonoff 4CH Pro', () => {
    const features = models[modelId].getFeatures('device_external_id');

    expect(features).to.deep.eq([
      {
        name: 'Switch 1',
        external_id: 'device_external_id:switch:binary:1',
        selector: 'device-external-id-switch-binary-1',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'Switch 2',
        external_id: 'device_external_id:switch:binary:2',
        selector: 'device-external-id-switch-binary-2',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'Switch 3',
        external_id: 'device_external_id:switch:binary:3',
        selector: 'device-external-id-switch-binary-3',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'Switch 4',
        external_id: 'device_external_id:switch:binary:4',
        selector: 'device-external-id-switch-binary-4',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
    ]);
  });
});
