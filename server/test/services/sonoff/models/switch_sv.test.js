const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 3;

describe('SonoffService - Model - SV', () => {
  it('get model for Sonoff SV', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-sv');
  });

  it('get label for Sonoff SV', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff SV');
  });

  it('get features for Sonoff SV', () => {
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

  it('no fill features for Sonoff SV', () => {
    expect(models[modelId].fillFeatures).to.eq(undefined);
  });
});
