const sinon = require('sinon');

const { assert, fake } = sinon;
const { EVENTS } = require('../../../../utils/constants');
const { MockedMqttClient } = require('../mocks.test');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
};

const MqttHandler = require('../../../../services/mqtt/lib');

describe('Mqtt handle message', () => {
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  beforeEach(async () => {
    await mqttHandler.connect();
    sinon.reset();
  });

  afterEach(() => {
    mqttHandler.disconnect();
  });

  it('should not do anything, topic not found', () => {
    mqttHandler.handleNewMessage('UNKNOWN_TOPIC', '{}');

    assert.notCalled(gladys.event.emit);
  });

  it('should not do anything, JSON parsing failed', () => {
    mqttHandler.handleNewMessage('gladys/master/device/create', 'thisisnotjson');

    assert.notCalled(gladys.event.emit);
  });

  it('should create device', () => {
    mqttHandler.handleNewMessage('gladys/master/device/create', '{}');

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW, {});
  });

  it('should create device state', () => {
    const message = {
      identifier: 'id',
      type: 'type',
      state: {
        value: '0',
      },
    };
    mqttHandler.handleNewMessage('gladys/master/devicestate/create', JSON.stringify(message));

    const expectedEvent = {
      device_feature_external_id: `${message.identifier}:${message.type}`,
      state: message.state.value,
    };
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
