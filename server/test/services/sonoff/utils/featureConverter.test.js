const { expect } = require('chai');
const uuid = require('uuid');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const { featureConverter } = require('../../../../services/sonoff/utils/featureConverter');

describe('SonoffService - featureConverter', () => {
  it('get features for unkown device', () => {
    const features = featureConverter(uuid, -1);

    expect(features).to.be.lengthOf(0);
  });

  it('get features for Sonoff Basic', () => {
    const features = featureConverter(uuid, 1);

    expect(features).to.be.lengthOf(1);

    expect(features[0].category).to.be.eq(DEVICE_FEATURE_CATEGORIES.SWITCH);
    expect(features[0].type).to.be.eq(DEVICE_FEATURE_TYPES.SWITCH.BINARY);
  });

  it('get features for Sonoff Pow', () => {
    const features = featureConverter(uuid, 8);

    expect(features).to.be.lengthOf(1);

    expect(features[0].category).to.be.eq(DEVICE_FEATURE_CATEGORIES.SWITCH);
    expect(features[0].type).to.be.eq(DEVICE_FEATURE_TYPES.SWITCH.BINARY);
  });

  it('get features for Sonoff Plug S2x', () => {
    const features = featureConverter(uuid, 6);

    expect(features).to.be.lengthOf(2);

    expect(features[0].category).to.be.eq(DEVICE_FEATURE_CATEGORIES.SWITCH);
    expect(features[0].type).to.be.eq(DEVICE_FEATURE_TYPES.SWITCH.BINARY);

    expect(features[1].category).to.be.eq(DEVICE_FEATURE_CATEGORIES.SWITCH);
    expect(features[1].type).to.be.eq(DEVICE_FEATURE_TYPES.SWITCH.POWER);
  });
});
