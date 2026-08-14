const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const { MockedMqttClient, mqttApi } = require('../mocks.test');
const logger = require('../../../../utils/logger');

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

  it('should log the topic and the message published', async () => {
    const debugStub = sinon.stub(logger, 'debug');
    try {
      await mqttHandler.connect({ mqttUrl: 'url' });
      mqttHandler.publish('my/topic', '{"state":"ON"}');

      assert.calledWith(mqttApi.publish, 'my/topic', '{"state":"ON"}', undefined, sinon.match.func);
      assert.calledWith(debugStub, sinon.match('my/topic').and(sinon.match('{"state":"ON"}')));
    } finally {
      debugStub.restore();
    }
  });
});
