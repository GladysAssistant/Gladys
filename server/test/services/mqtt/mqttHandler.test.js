const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
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
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  mqttHandler.init();

  beforeEach(() => {
    sinon.reset();
  });

  it('should have falsy status', async () => {
    expect(mqttHandler.configured).to.eq(false);
    expect(mqttHandler.connected).to.eq(false);
  });

  it('should have binded topics', async () => {
    expect(Object.keys(mqttHandler.topicBinds)).deep.eq(['gladys/master/#']);
  });

  it('should call connect function', async () => {
    await mqttHandler.connect();
    assert.callCount(gladys.variable.getValue, 3);
    assert.calledOnce(MockedMqttClient.internalConnect);
    expect(mqttHandler.configured).to.eq(true);
    expect(mqttHandler.connected).to.eq(false);
  });

  it('should call error', async () => {
    event.emit('error');
    assert.notCalled(mqttHandler.mqttClient.subscribe);
  });

  it('should call subscribe function', async () => {
    event.emit('connect');
    assert.calledOnce(mqttHandler.mqttClient.subscribe);
    expect(mqttHandler.configured).to.eq(true);
    expect(mqttHandler.connected).to.eq(true);
  });

  it('should send new state', () => {
    event.emit(
      'message',
      'gladys/master/device/my_device_external_id/feature/my_feature_external_id/state',
      Buffer.from('19.8'),
    );

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'my_feature_external_id',
      state: 19.8,
    });
  });
});
