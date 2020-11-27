const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');
const TasmotaMQTTHandler = require('../../../../../services/tasmota/lib/mqtt');

const mqttService = {
  device: {
    unsubscribe: fake.returns(null),
  },
};
const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
};
const serviceId = 'service-uuid-random';

describe('Tasmota - MQTT - disconnect', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);

    tasmotaHandler = new TasmotaMQTTHandler(tasmota);
    tasmotaHandler.mqttService = mqttService;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('disconnect with unsubscription', () => {
    tasmotaHandler.disconnect();

    assert.calledWith(mqttService.device.unsubscribe, 'stat/+/+');
    assert.calledWith(mqttService.device.unsubscribe, 'tele/+/+');
  });
});
