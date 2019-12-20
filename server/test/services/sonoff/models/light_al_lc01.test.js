const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 37;

describe('SonoffService - Model - Arilux LC01', () => {
  it('get model for Arilux LC01', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('arilux-lc01');
  });

  it('get label for Arilux LC01', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Arilux LC01');
  });

  it('get features for Arilux LC01', () => {
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
      {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 16777215,
      },
    ]);
  });

  it('no fill features for Arilux LC01', () => {
    expect(models[modelId].fillFeatures).to.eq(undefined);
  });
});
