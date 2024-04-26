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
    await mqttHandler.connect({ mqttUrl: 'url' });
    sinon.reset();
  });

  afterEach(() => {
    mqttHandler.disconnect();
  });

  it('should not do anything, topic not found', () => {
    mqttHandler.handleNewMessage('UNKNOWN_TOPIC', '{}');

    assert.notCalled(gladys.event.emit);
  });

  it('should create device', () => {
    mqttHandler.handleNewMessage('gladys/master/device/create', '{}');

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW, {});
  });

  it('should update device state', () => {
    mqttHandler.handleNewMessage(
      'gladys/master/device/my_device_external_id/feature/my_feature_external_id/state',
      '19.8',
    );

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'my_feature_external_id',
      state: 19.8,
    });
  });

  it('should update device string state', () => {
    mqttHandler.handleNewMessage(
      'gladys/master/device/my_device_external_id/feature/my_feature_external_id/text',
      'my-text',
    );

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'my_feature_external_id',
      text: 'my-text',
    });
  });

  it('should fail to update device state, but not crash', () => {
    mqttHandler.handleNewMessage('gladys/master/device/my_device_external_id/', '19.8');

    assert.notCalled(gladys.event.emit);
  });

  it('should execute scene', () => {
    mqttHandler.handleNewMessage('gladys/master/scene/test-scene/start', '');

    assert.calledWith(gladys.event.emit, EVENTS.SCENE.TRIGGERED, 'test-scene');
  });

  it('handle strict topic', () => {
    mqttHandler.handleNewMessage('gladys/master/random-topic', '{}');

    assert.notCalled(gladys.event.emit);
  });
});
