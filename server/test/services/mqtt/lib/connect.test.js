const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { MockedMqttClient, mqttApi } = require('../mocks.test');

const MqttHandler = require('../../../../services/mqtt/lib');

describe('mqttHandler.connect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should connect and receive success', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const configuration = {
      mqttUrl: 'url',
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect(configuration);
    mqttHandler.mqttClient.emit('connect');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED,
    });
  });
  it('should connect and receive error, then reconnect', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const configuration = {
      mqttUrl: 'url',
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect(configuration);
    mqttHandler.mqttClient.emit('error', { test: 'test' });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
      payload: { test: 'test' },
    });
    mqttHandler.mqttClient.emit('reconnect');
  });
  it('should connect and receive offline', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const configuration = {
      mqttUrl: 'url',
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect(configuration);
    mqttHandler.mqttClient.emit('offline');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
      payload: 'DISCONNECTED',
    });
  });

  it('should faild connection', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const configuration = {};

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    try {
      await mqttHandler.connect(configuration);
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }
  });

  it('should connect and confirm it', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const configuration = {
      mqttUrl: 'url',
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect(configuration);

    const handleGladysMessage = fake.resolves(null);
    mqttHandler.subscribe('gladys/master/#', handleGladysMessage);

    mqttHandler.mqttClient.emit('connect');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED,
    });
    assert.called(mqttHandler.mqttClient.subscribe);
  });

  it('should connect and receive an error', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const configuration = {
      mqttUrl: 'url',
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect(configuration);
    mqttHandler.mqttClient.emit('error', 'err');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
      payload: 'err',
    });
  });

  it('should connect and receive message', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const configuration = {
      mqttUrl: 'url',
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect(configuration);
    mqttHandler.handleNewMessage = fake.resolves(null);

    mqttHandler.mqttClient.emit(
      'message',
      'gladys/master/device/my_device_external_id/feature/my_feature_external_id/state',
      Buffer.from('19.8'),
    );
    assert.calledOnce(mqttHandler.handleNewMessage);
  });

  it('should subscribe to the custom topics of the devices loaded before the connection', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

    // Devices are loaded in RAM before the services are started, so the custom
    // topics are registered while there is no MQTT client yet
    await mqttHandler.listenToCustomMqttTopicIfNeeded({
      selector: 'my-device',
      features: [{ id: 'b42d3688-4403-479a-9376-9f5227ab543a' }, { id: '8bd23b1b-b8f5-4b31-9c0e-2b23b1a06c26' }],
      params: [
        {
          name: 'mqtt_custom_topic_feature:b42d3688-4403-479a-9376-9f5227ab543a',
          value: 'custom_mqtt_topic/temperature',
        },
        {
          name: 'mqtt_custom_topic_feature:8bd23b1b-b8f5-4b31-9c0e-2b23b1a06c26',
          value: 'custom_mqtt_topic/temperature',
        },
      ],
    });
    assert.notCalled(mqttApi.subscribe);

    await mqttHandler.connect({ mqttUrl: 'url' });
    mqttHandler.mqttClient.emit('connect');

    assert.calledWith(mqttApi.subscribe, 'custom_mqtt_topic/temperature');
    // The two features share the same topic: only one subscription is sent
    const subscriptionsToCustomTopic = mqttApi.subscribe
      .getCalls()
      .filter((call) => call.args[0] === 'custom_mqtt_topic/temperature');
    expect(subscriptionsToCustomTopic).to.have.lengthOf(1);
  });
});
