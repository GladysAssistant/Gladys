const { expect } = require('chai');

const uuid = require('uuid');
const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 6;

describe('SonoffService - Model - Pow', () => {
  it('get model for Sonoff Pow', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-pow');
  });

  it('get features for Sonoff Pow', () => {
    const features = models[modelId].getFeatures(uuid, 'name', 'topic');

    expect(features).to.be.lengthOf(2);

    expect(features[0].name).to.be.eq('name');
    expect(features[0].category).to.be.eq(DEVICE_FEATURE_CATEGORIES.SWITCH);
    expect(features[0].type).to.be.eq(DEVICE_FEATURE_TYPES.SWITCH.BINARY);
    expect(features[0].external_id).to.be.eq(`sonoff:topic:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`);

    expect(features[1].name).to.be.eq('name - power');
    expect(features[1].category).to.be.eq(DEVICE_FEATURE_CATEGORIES.SWITCH);
    expect(features[1].type).to.be.eq(DEVICE_FEATURE_TYPES.SWITCH.POWER);
    expect(features[1].external_id).to.be.eq(`sonoff:topic:${DEVICE_FEATURE_TYPES.SWITCH.POWER}`);
  });
});
