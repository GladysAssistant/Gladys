const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 12;

describe('SonoffService - Model - 1 Channel', () => {
  it('get model for Sonoff 1 Channel', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-1-channel');
  });

  it('get label for Sonoff 1 Channel', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff 1 Channel');
  });

  it('get features for Sonoff 1 Channel', () => {
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
    ]);
  });

  it('no fill features for Sonoff 1 Channel', () => {
    expect(models[modelId].fillFeatures).to.eq(undefined);
  });
});
