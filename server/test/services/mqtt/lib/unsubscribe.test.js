const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const { MockedMqttClient, mqttApi } = require('../mocks.test');

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
    sinon.reset();
    mqttHandler.subscribe('UNKNOWN_TOPIC', () => {});
  });

  it('should not unsubscribe, as not connected', () => {
    mqttHandler.unsubscribe('UNKNOWN_TOPIC');

    assert.notCalled(mqttApi.unsubscribe);
    expect(Object.keys(mqttHandler.topicBinds)).deep.eq([]);
  });

  it('should unsubscribe', async () => {
    await mqttHandler.connect({ mqttUrl: 'url' });
    mqttHandler.unsubscribe('UNKNOWN_TOPIC');

    assert.calledWith(mqttApi.unsubscribe, 'UNKNOWN_TOPIC');
    expect(Object.keys(mqttHandler.topicBinds)).deep.eq([]);
  });
});
