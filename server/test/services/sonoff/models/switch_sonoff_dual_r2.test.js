const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 39;

describe('SonoffService - Model - Dual R2', () => {
  it('get model for Sonoff Dual R2', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-dual-r2');
  });

  it('get label for Sonoff Dual R2', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff Dual R2');
  });

  it('get features for Sonoff Dual R2', () => {
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
    ]);
  });
});
