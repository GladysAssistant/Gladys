const { assert, fake } = require('sinon');
const { EVENTS } = require('../../../utils/constants');
const { MockedMqttClient } = require('./mocks.test');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
};

const MqttHandler = require('../../../services/mqtt/lib');

describe('MqttHandler', () => {
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  it('should call connect function', async () => {
    await mqttHandler.connect();
    assert.callCount(gladys.variable.getValue, 3);
    assert.calledOnce(MockedMqttClient.internalConnect);
  });
  it('should create device', () => {
    mqttHandler.handleNewMessage('gladys/master/device/create', '{}');
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW, {});
  });
  it('should not do anything, topic not found', () => {
    mqttHandler.handleNewMessage('UNKNOWN_TOPIC', '{}');
  });
  it('should not do anything, JSON parsing failed', () => {
    mqttHandler.handleNewMessage('gladys/master/device/create', 'thisisnotjson');
  });
});
