const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 11;

describe('SonoffService - Model - Sonoff LED', () => {
  it('get model for Sonoff LED', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-led');
  });

  it('get label for Sonoff LED', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff LED');
  });

  it('get features for Sonoff LED', () => {
    const features = models[modelId].getFeatures();

    expect(features).to.deep.eq([
      {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        read_only: false,
        has_feedback: true,
        min: 1,
        max: 100,
      },
    ]);
  });

  it('no fill features for Sonoff LED', () => {
    expect(models[modelId].fillFeatures).to.eq(undefined);
  });
});
