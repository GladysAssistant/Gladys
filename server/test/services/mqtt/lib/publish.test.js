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
  });

  it('should not publish, as not connected', () => {
    mqttHandler.publish('UNKNOWN_TOPIC', '{}');

    assert.notCalled(mqttApi.publish);
  });

  it('should publish message', async () => {
    await mqttHandler.connect({ mqttUrl: 'url' });
    mqttHandler.publish('UNKNOWN_TOPIC', '{}');

    assert.calledWith(mqttApi.publish, 'UNKNOWN_TOPIC', '{}', undefined, sinon.match.func);
  });
});
