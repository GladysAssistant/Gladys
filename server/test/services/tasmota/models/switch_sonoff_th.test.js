const { expect } = require('chai');

const models = require('../../../../services/tasmota/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 4;

describe('TasmotaService - Model - Sonoff TH', () => {
  it('get model for Sonoff TH', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('sonoff-th');
  });

  it('get label for Sonoff TH', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Sonoff TH');
  });

  it('get features for Sonoff TH', () => {
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
