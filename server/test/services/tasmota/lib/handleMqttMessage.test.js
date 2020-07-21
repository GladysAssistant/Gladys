const sinon = require('sinon');

const { assert, fake } = sinon;
const TasmotaHandler = require('../../../../services/tasmota/lib');

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

describe('Mqtt handle message', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  tasmotaHandler.mqttService = mqttService;

  beforeEach(async () => {
    sinon.reset();
  });

  it('should change TASMOTA sensor state not handled (SENSOR topic)', () => {
    tasmotaHandler.handleMqttMessage('tele/my_device/SENSOR', JSON.stringify({ HELLO: 'with_value ?' }));

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should ask for TASMOTA status (LWT topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/LWT', 'anything');

    assert.calledWith(mqttService.device.publish, 'cmnd/my_device/status');
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing on unkown TASMOTA topic', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/UNKOWN', '{ "POWER": "ON"}');

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });
});
