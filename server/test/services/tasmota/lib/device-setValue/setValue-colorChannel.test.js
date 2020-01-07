const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');

const mqttService = {
  device: {
    publish: fake.resolves(null),
  },
};
const gladys = {};

describe('TasmotaHandler - setValue - Color', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, 'service-uuid-random');
  tasmotaHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('Set number value', () => {
    const device = {};
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:Channel',
    };
    const value = 1243700;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/Channel', '18,250,52');
  });
});
