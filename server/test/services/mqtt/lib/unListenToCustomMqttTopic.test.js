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

describe('Mqtt.unListenToCustomMqttTopic', () => {
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  before(async () => {
    await mqttHandler.connect({ mqttUrl: 'url' });
  });

  beforeEach(async () => {
    sinon.reset();
  });

  it('should connect to custom mqtt topic then disconnect', async () => {
    const device = {
      selector: 'my-device',
      features: [{ id: 'b42d3688-4403-479a-9376-9f5227ab543a' }],
      params: [
        {
          name: 'mqtt_custom_topic_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'custom_mqtt_topic/test/test',
        },
      ],
    };
    await mqttHandler.listenToCustomMqttTopicIfNeeded(device);
    assert.calledWith(mqttApi.subscribe, 'custom_mqtt_topic/test/test');
    await mqttHandler.unListenToCustomMqttTopic(device);
    assert.calledWith(mqttApi.unsubscribe, 'custom_mqtt_topic/test/test');
  });
  it('should connect to custom mqtt topic then disconnect and not unsubscribe because used in normal listeners', async () => {
    const device = {
      selector: 'my-device',
      features: [{ id: 'b42d3688-4403-479a-9376-9f5227ab543a' }],
      params: [
        {
          name: 'mqtt_custom_topic_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'custom_mqtt_topic/test/test',
        },
      ],
    };
    await mqttHandler.listenToCustomMqttTopicIfNeeded(device);
    await mqttHandler.subscribe('custom_mqtt_topic/test/test', fake.returns(null));
    assert.calledWith(mqttApi.subscribe, 'custom_mqtt_topic/test/test');
    await mqttHandler.unListenToCustomMqttTopic(device);
    assert.notCalled(mqttApi.unsubscribe);
  });
  it('should disconnect without connecting', async () => {
    const device = {
      selector: 'my-device',
      features: [{ id: 'b42d3688-4403-479a-9376-9f5227ab543a' }],
      params: [
        {
          name: 'mqtt_custom_topic_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'custom_mqtt_topic/test/test',
        },
      ],
    };
    await mqttHandler.unListenToCustomMqttTopic(device);
    assert.notCalled(mqttApi.unsubscribe);
  });
});
