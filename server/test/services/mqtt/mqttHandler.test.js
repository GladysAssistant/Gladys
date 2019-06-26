const { assert, fake } = require('sinon');
const { EVENTS } = require('../../../utils/constants');
const { MockedMqttClient, event } = require('./mocks.test');

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
  const mqttHandler = new MqttHandler(
    gladys,
    MockedMqttClient,
    'url',
    'username',
    'password',
    'faea9c35-759a-44d5-bcc9-2af1de37b8b4',
  );
  it('should call connect function', () => {
    mqttHandler.connect();
    assert.called(MockedMqttClient.connect);
    event.emit('connect');
    event.emit('error', 'this is an error');
    event.emit('message', 'test', 'test');
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
