const { expect } = require('chai');

const models = require('../../../../services/tasmota/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 8;

describe('TasmotaService - Model - Plug S2x', () => {
  it('get model for Sonoff Plug S2x', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-s2x');
  });

  it('get label for Sonoff S20/S26 Smart Plug', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff S20/S26 Smart Plug');
  });

  it('get features for Sonoff Plug S2x', () => {
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
