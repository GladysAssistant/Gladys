const { expect } = require('chai');

const uuid = require('uuid');
const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 8;

describe('SonoffService - Model - Plug S2x', () => {
  it('get model for Sonoff Plug S2x', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-s2x');
  });

  it('get features for Sonoff Plug S2x', () => {
    const features = models[modelId].getFeatures(uuid, 'name', 'topic');

    expect(features).to.be.lengthOf(1);

    expect(features[0].name).to.be.eq('name');
    expect(features[0].category).to.be.eq(DEVICE_FEATURE_CATEGORIES.SWITCH);
    expect(features[0].type).to.be.eq(DEVICE_FEATURE_TYPES.SWITCH.BINARY);
    expect(features[0].external_id).to.be.eq(`sonoff:topic:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`);
  });
});
