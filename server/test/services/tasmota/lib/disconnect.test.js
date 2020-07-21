const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../services/tasmota/lib');

const mqttService = {
  device: {
    unsubscribe: fake.returns(null),
  },
};

describe('TasmotaHandler - disconnect', () => {
  const tasmotaHandler = new TasmotaHandler({}, 'service-uuid-random');
  tasmotaHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('disconnect with unsubscription', () => {
    tasmotaHandler.disconnect();

    assert.calledWith(mqttService.device.unsubscribe, 'stat/+/+');
    assert.calledWith(mqttService.device.unsubscribe, 'tele/+/+');
  });
});
