const sinon = require('sinon');

const { assert, fake } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');
const TasmotaMQTTHandler = require('../../../../../services/tasmota/lib/mqtt');

const serviceId = 'service-uuid-random';
const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
};
const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};

describe('Tasmota - MQTT - Handle message', () => {
  let tasmotaHandler;

  beforeEach(async () => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = new TasmotaMQTTHandler(tasmota);
    tasmotaHandler.mqttService = mqttService;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should change TASMOTA sensor state not handled (SENSOR topic)', () => {
    tasmotaHandler.handleMessage('tele/my_device/SENSOR', JSON.stringify({ HELLO: 'with_value ?' }));

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should ask for TASMOTA status (LWT topic)', () => {
    tasmotaHandler.handleMessage('stat/my_device/LWT', 'anything');

    assert.calledWith(mqttService.device.publish, 'cmnd/my_device/status');
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing on unkown TASMOTA topic', () => {
    tasmotaHandler.handleMessage('stat/my_device/UNKOWN', '{ "POWER": "ON"}');

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });
});
