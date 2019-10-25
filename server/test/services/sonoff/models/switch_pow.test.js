const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 6;

describe('SonoffService - Model - Pow', () => {
  it('get model for Sonoff Pow', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-pow');
  });

  it('get features for Sonoff Pow', () => {
    const features = models[modelId].getFeatures();

    expect(features).to.deep.eq([
      {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 10000,
        unit: 'A',
      },
    ]);
  });
});
