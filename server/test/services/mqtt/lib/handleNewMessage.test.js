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
    mqttHandler.init();
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

  it('should update device state', () => {
    mqttHandler.handleNewMessage('gladys/master/device/state/update', '{}');

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {});
  });

  it('handle stric topic', () => {
    mqttHandler.handleNewMessage('gladys/master/#', '{}');

    assert.notCalled(gladys.event.emit);
  });
});
