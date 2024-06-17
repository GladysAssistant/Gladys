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

describe('Mqtt.listenToCustomMqttTopicIfNeeded', () => {
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  before(async () => {
    await mqttHandler.connect({ mqttUrl: 'url' });
  });

  beforeEach(async () => {
    sinon.reset();
    mqttHandler.deviceFeatureCustomMqttTopics = [];
  });

  it('should not connect, as device doesnt have the param', async () => {
    const device = {
      selector: 'my-device',
      params: [],
    };
    await mqttHandler.listenToCustomMqttTopicIfNeeded(device);
    assert.notCalled(mqttApi.subscribe);
  });

  it('should connect to custom mqtt topic', async () => {
    const device = {
      selector: 'my-device',
      params: [
        {
          name: 'mqtt_custom_topic_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'custom_mqtt_topic/test/test',
        },
      ],
    };
    await mqttHandler.listenToCustomMqttTopicIfNeeded(device);
    assert.calledWith(mqttApi.subscribe, 'custom_mqtt_topic/test/test');
    expect(mqttHandler.deviceFeatureCustomMqttTopics).to.deep.equal([
      {
        device_feature_id: 'b42d3688-4403-479a-9376-9f5227ab543a',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: null,
      },
    ]);
  });

  it('should connect to custom mqtt topic with custom and custom object path', async () => {
    const device = {
      selector: 'my-device',
      params: [
        {
          name: 'mqtt_custom_topic_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'custom_mqtt_topic/test/test',
        },
        {
          name: 'mqtt_custom_object_path_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'data.temperature',
        },
      ],
    };
    await mqttHandler.listenToCustomMqttTopicIfNeeded(device);
    assert.calledWith(mqttApi.subscribe, 'custom_mqtt_topic/test/test');
    expect(mqttHandler.deviceFeatureCustomMqttTopics).to.deep.equal([
      {
        device_feature_id: 'b42d3688-4403-479a-9376-9f5227ab543a',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: 'data.temperature',
      },
    ]);
  });
  it('should connect to custom mqtt topic with multiple custom and custom object path', async () => {
    const device = {
      selector: 'my-device',
      params: [
        {
          name: 'mqtt_custom_topic_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'custom_mqtt_topic/test/test',
        },
        {
          name: 'mqtt_custom_object_path_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'data.temperature',
        },
        {
          name: 'mqtt_custom_topic_feature:a6dd0aef-9432-4ed4-a313-5d4800acdcfb',
          value: 'custom_mqtt_topic/test/test',
        },
        {
          name: 'mqtt_custom_object_path_feature:a6dd0aef-9432-4ed4-a313-5d4800acdcfb',
          value: 'data.co2',
        },
      ],
    };
    await mqttHandler.listenToCustomMqttTopicIfNeeded(device);
    assert.calledWith(mqttApi.subscribe, 'custom_mqtt_topic/test/test');
    expect(mqttHandler.deviceFeatureCustomMqttTopics).to.deep.equal([
      {
        device_feature_id: 'b42d3688-4403-479a-9376-9f5227ab543a',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: 'data.temperature',
      },
      {
        device_feature_id: 'a6dd0aef-9432-4ed4-a313-5d4800acdcfb',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: 'data.co2',
      },
    ]);
  });
});
