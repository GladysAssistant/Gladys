const sinon = require('sinon');

const { assert, fake } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { MockedMqttClient } = require('../mocks.test');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  stateManager: {
    get: fake.returns({
      external_id: 'device_feature_external_id',
    }),
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
    mqttHandler.debugMode = false;
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
  it('handle device with custom topic and debug mode', () => {
    mqttHandler.debugMode = true;
    mqttHandler.deviceFeatureCustomMqttTopics = [];
    mqttHandler.handleNewMessage('custom_mqtt_topic/test/test', '12');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.DEBUG_NEW_MQTT_MESSAGE,
      payload: {
        topic: 'custom_mqtt_topic/test/test',
        message: '12',
      },
    });
  });
  it('handle device with custom topic', () => {
    mqttHandler.deviceFeatureCustomMqttTopics = [
      {
        device_feature_id: 'b42d3688-4403-479a-9376-9f5227ab543a',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: null,
      },
    ];
    mqttHandler.handleNewMessage('custom_mqtt_topic/test/test', '12');

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'device_feature_external_id',
      state: '12',
    });
  });
  it('handle device with custom topic and custom object path', () => {
    mqttHandler.deviceFeatureCustomMqttTopics = [
      {
        device_feature_id: 'b42d3688-4403-479a-9376-9f5227ab543a',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: 'test.temperature',
      },
    ];
    mqttHandler.handleNewMessage(
      'custom_mqtt_topic/test/test',
      JSON.stringify({
        test: {
          temperature: 18,
        },
      }),
    );

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'device_feature_external_id',
      state: 18,
    });
  });
  it('handle device with multiple features on same custom topic', () => {
    mqttHandler.deviceFeatureCustomMqttTopics = [
      {
        device_feature_id: 'b42d3688-4403-479a-9376-9f5227ab543a',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: 'test.temperature',
      },
      {
        device_feature_id: '309c9ec6-193b-4fb5-a4db-29874984e834',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: 'test.co2',
      },
    ];
    mqttHandler.handleNewMessage(
      'custom_mqtt_topic/test/test',
      JSON.stringify({
        test: {
          temperature: 18,
          co2: 500,
        },
      }),
    );

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'device_feature_external_id',
      state: 18,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'device_feature_external_id',
      state: 500,
    });
  });
  it('handle device with custom topic, custom object path and broken JSON', () => {
    mqttHandler.deviceFeatureCustomMqttTopics = [
      {
        device_feature_id: 'b42d3688-4403-479a-9376-9f5227ab543a',
        regex_key: 'custom_mqtt_topic/test/test',
        topic: 'custom_mqtt_topic/test/test',
        object_path: 'test.temperature',
      },
    ];
    mqttHandler.handleNewMessage('custom_mqtt_topic/test/test', 'broken-JSON');

    assert.notCalled(gladys.event.emit);
  });
});
