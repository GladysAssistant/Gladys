const { expect } = require('chai');

const models = require('../../../../services/tasmota/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 26;

describe('TasmotaService - Model - Sonoff B1', () => {
  it('get model for Sonoff B1', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-b1');
  });

  it('get label for Sonoff B1', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff B1');
  });

  it('get features for Sonoff B1', () => {
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
      {
        name: 'Brightness',
        external_id: 'device_external_id:light:brightness',
        selector: 'device-external-id-light-brightness',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        read_only: false,
        has_feedback: true,
        min: 1,
        max: 100,
      },
      {
        name: 'Color',
        external_id: 'device_external_id:light:color',
        selector: 'device-external-id-light-color',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 16777215,
      },
    ]);
  });
});
