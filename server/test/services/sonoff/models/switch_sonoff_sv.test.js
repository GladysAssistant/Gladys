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
    ]);
  });
});
