const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 5;

describe('SonoffService - Model - Dual', () => {
  it('get model for Sonoff Dual', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-dual');
  });

  it('get label for Sonoff Dual', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff Dual');
  });

  it('get features for Sonoff Dual', () => {
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

  it('fill features for Sonoff Dual', () => {
    const name = 'deviceName';
    const features = models[modelId].getFeatures();
    const device = {
      name,
      features,
      external_id: 'device_external_id',
    };

    models[modelId].fillFeatures(device);

    for (let i = 0; i < 2; i += 1) {
      const feature = features[i];
      expect(feature.name).to.eq(`deviceName - switch ${i + 1}`);
      expect(feature.external_id).to.eq(`device_external_id:switch:binary:${i + 1}`);
    }
  });
});
