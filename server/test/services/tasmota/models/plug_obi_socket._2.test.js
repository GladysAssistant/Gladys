const { expect } = require('chai');

const models = require('../../../../services/tasmota/models');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const modelId = 61;

describe('TasmotaService - Model - Obi Socket 2', () => {
  it('get model for Obi Socket 2', () => {
    const model = models[modelId].getModel();

    expect(model).to.eq('obi-socket-2');
  });

  it('get label for Obi Socket 2', () => {
    const label = models[modelId].getLabel();

    expect(label).to.eq('Obi Socket 2');
  });

  it('get features for Obi Socket 2', () => {
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
