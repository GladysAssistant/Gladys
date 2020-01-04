const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 9;

describe('SonoffService - Model - Slampher', () => {
  it('get model for Slampher', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('slampher');
  });

  it('get label for Slampher', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Slampher');
  });

  it('get features for Slampher', () => {
    const features = models[modelId].getFeatures('device_external_id');

    expect(features).to.deep.eq([
      {
        name: 'Switch',
        external_id: 'device_external_id:light:binary',
        selector: 'device-external-id-light-binary',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
    ]);
  });
});
