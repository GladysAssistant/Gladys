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

  it('should not unsubscribe from broker if device feature is still listening to topic', async () => {
    await mqttHandler.connect({ mqttUrl: 'url' });
    mqttHandler.subscribe('SHARED_TOPIC', () => {});
    // Simulate a device feature listening to the same topic
    mqttHandler.deviceFeatureCustomMqttTopics.push({
      topic: 'SHARED_TOPIC',
      device_feature_id: 'device-feature-id',
    });

    mqttHandler.unsubscribe('SHARED_TOPIC');

    // Should NOT call mqttClient.unsubscribe because device feature is still listening
    assert.notCalled(mqttApi.unsubscribe);
    // But should still remove from topicBinds (only UNKNOWN_TOPIC from beforeEach remains)
    expect(mqttHandler.topicBinds).to.not.have.property('SHARED_TOPIC');

    // Cleanup
    mqttHandler.deviceFeatureCustomMqttTopics = [];
  });

  it('should unsubscribe from broker if no device feature is listening to topic', async () => {
    await mqttHandler.connect({ mqttUrl: 'url' });
    mqttHandler.subscribe('UNIQUE_TOPIC', () => {});
    // Simulate a device feature listening to a DIFFERENT topic
    mqttHandler.deviceFeatureCustomMqttTopics.push({
      topic: 'OTHER_TOPIC',
      device_feature_id: 'device-feature-id',
    });

    mqttHandler.unsubscribe('UNIQUE_TOPIC');

    // Should call mqttClient.unsubscribe because no device feature is listening to this topic
    assert.calledWith(mqttApi.unsubscribe, 'UNIQUE_TOPIC');
    // Should remove from topicBinds (only UNKNOWN_TOPIC from beforeEach remains)
    expect(mqttHandler.topicBinds).to.not.have.property('UNIQUE_TOPIC');

    // Cleanup
    mqttHandler.deviceFeatureCustomMqttTopics = [];
  });
});
