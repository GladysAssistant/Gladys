const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');

const mqttService = {
  device: {
    publish: fake.resolves(null),
  },
};
const gladys = {};

describe('TasmotaHandler - setValue - POWER', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, 'service-uuid-random');
  tasmotaHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('Set power ON', () => {
    const device = {};
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:POWER',
    };
    const value = 1;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/POWER', 'ON');
  });

  it('Set power OFF', () => {
    const device = {};
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:POWER',
    };
    const value = 0;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/POWER', 'OFF');
  });
});
