const sinon = require('sinon');

const { assert, fake } = sinon;
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {});

const event = {
  emit: fake.resolves(null),
};

const container = {
  id: 'docker-test',
};

const gladys = {
  event,
  variable: {
    setValue: fake.resolves(true),
  },
  system: {
    getContainers: fake.resolves([container]),
    stopContainer: fake.resolves(true),
  },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const eventMqtt = new EventEmitter();

const mqtt = Object.assign(eventMqtt, {
  subscribe: fake.resolves(null),
});

const mqttLibrary = {
  connect: fake.returns(mqtt),
};

const configuration = { mqttUrl: 'fakeUrl', mqttUsername: 'username', mqttPassword: 'password' };

describe('zigbee2mqtt connect', () => {
  // PREPARE
  const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('it should not try to connect to mqtt', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = false;
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    // ASSERT
    assert.notCalled(mqttLibrary.connect);
  });

  it('it should try to connect to mqtt', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = true;
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    // ASSERT
    // TODO: check parameters
    assert.calledOnce(mqttLibrary.connect);
  });

  it('it should receive mqtt connect message', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = true;
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    zigbee2mqttManager.mqttClient.emit('connect');
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.match(zigbee2mqttManager.gladysConnected, true);
    assert.calledWith(mqtt.subscribe, 'zigbee2mqtt/#');
  });

  it('it should receive mqtt error message', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = true;
    const error = new Error('mqtt_error');
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    zigbee2mqttManager.mqttClient.emit('error', error);
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.MQTT_ERROR,
      payload: error,
    });
    assert.match(zigbee2mqttManager.gladysConnected, false);
  });

  it('it should receive mqtt offline message', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = true;
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    zigbee2mqttManager.mqttClient.emit('offline');
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
      payload: 'DISCONNECTED',
    });
    assert.match(zigbee2mqttManager.gladysConnected, false);
  });

  it('it should receive mqtt normal message', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = true;
    zigbee2mqttManager.handleMqttMessage = fake.returns(true);
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    zigbee2mqttManager.mqttClient.emit('message', 'topic', 'message');
    // ASSERT
    assert.calledWithExactly(zigbee2mqttManager.handleMqttMessage, 'topic', 'message');
  });
});
