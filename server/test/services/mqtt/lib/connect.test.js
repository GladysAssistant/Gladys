const sinon = require('sinon');

const { assert, fake } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { MockedMqttClient } = require('../mocks.test');

const MqttHandler = require('../../../../services/mqtt/lib');

describe('mqttHandler.connect', () => {
  it('should connect and receive success', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('result'),
      },
      event: {
        emit: fake.returns(null),
      },
    };
    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect();
    mqttHandler.mqttClient.emit('connect');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED,
    });
  });
  it('should connect and receive error', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('result'),
      },
      event: {
        emit: fake.returns(null),
      },
    };
    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect();
    mqttHandler.mqttClient.emit('error', { test: 'test' });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
      payload: { test: 'test' },
    });
  });
  it('should connect and receive offline', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('result'),
      },
      event: {
        emit: fake.returns(null),
      },
    };
    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.connect();
    mqttHandler.mqttClient.emit('offline');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
      payload: 'DISCONNECTED',
    });
  });
});
