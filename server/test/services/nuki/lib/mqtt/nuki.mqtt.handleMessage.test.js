const sinon = require('sinon');

const { assert, fake } = sinon;
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');

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

describe('Nuki - MQTT - Handle message', () => {
  let nukiHandler;

  beforeEach(async () => {
    const nuki = new NukiHandler(gladys, serviceId);
    nukiHandler = new NukiMQTTHandler(nuki);
    nukiHandler.mqttService = mqttService;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should change NUKI lock state not handled', () => {
    nukiHandler.handleMessage('homeassistant/my_device/LOCK', JSON.stringify({ HELLO: 'with_value ?' }));

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing on unkown NUKI topic', () => {
    nukiHandler.handleMessage('stat/my_device/UNKOWN', '{ "POWER": "ON"}');

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });
});
