const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../services/tasmota/lib');

const mqttService = {
  device: {
    subscribe: fake.returns(null),
  },
};
const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
};

describe('TasmotaHandler - connect', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, 'service-uuid-random');
  sinon.spy(tasmotaHandler, 'handleMqttMessage');

  beforeEach(() => {
    sinon.reset();
  });

  it('connect with subscription', () => {
    tasmotaHandler.connect();

    assert.calledWith(gladys.service.getService, 'mqtt');
    assert.callCount(mqttService.device.subscribe, 2);
    mqttService.device.subscribe.firstCall.calledWith(
      'stat/+/+',
      tasmotaHandler.handleMqttMessage.bind(tasmotaHandler),
    );
    mqttService.device.subscribe.secondCall.calledWith(
      'tele/+/+',
      tasmotaHandler.handleMqttMessage.bind(tasmotaHandler),
    );
  });
});
