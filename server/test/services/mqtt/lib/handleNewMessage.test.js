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

  it('should update device state', () => {
    mqttHandler.handleNewMessage(
      'gladys/master/device/my_device_external_id/feature/my_feature_external_id/state',
      '19.8',
    );

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'my_feature_external_id',
      state: '19.8',
    });
  });

  it('handle strict topic', () => {
    mqttHandler.handleNewMessage('gladys/master/random-topic', '{}');

    assert.notCalled(gladys.event.emit);
  });
});
