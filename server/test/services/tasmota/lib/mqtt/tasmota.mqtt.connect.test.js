const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');
const TasmotaMQTTHandler = require('../../../../../services/tasmota/lib/mqtt');

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
const serviceId = 'service-uuid-random';

describe('Tasmota - MQTT - connect', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);

    tasmotaHandler = new TasmotaMQTTHandler(tasmota);
    sinon.spy(tasmotaHandler, 'handleMessage');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('connect with subscription', () => {
    tasmotaHandler.connect();

    assert.calledWith(gladys.service.getService, 'mqtt');
    assert.callCount(mqttService.device.subscribe, 2);
    mqttService.device.subscribe.firstCall.calledWith('stat/+/+', tasmotaHandler.handleMessage.bind(tasmotaHandler));
    mqttService.device.subscribe.secondCall.calledWith('tele/+/+', tasmotaHandler.handleMessage.bind(tasmotaHandler));
  });
});
