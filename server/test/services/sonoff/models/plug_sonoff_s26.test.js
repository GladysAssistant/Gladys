const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 8;

describe('SonoffService - Model - Plug S2x', () => {
  it('get model for Sonoff Plug S2x', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-s2x');
  });

  it('get label for Sonoff S20/S26 Smart Plug', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff S20/S26 Smart Plug');
  });

  it('get features for Sonoff Plug S2x', () => {
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

  it('no fill features for Sonoff Plug S2x', () => {
    expect(models[modelId].fillFeatures).to.eq(undefined);
  });
});
