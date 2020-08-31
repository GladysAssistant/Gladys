const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { MockedMqttClient } = require('../mocks.test');

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
  it('should connect and receive error', async () => {
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
});
