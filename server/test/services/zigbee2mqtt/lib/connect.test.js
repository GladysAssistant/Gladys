const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const EventEmitter = require('events');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const eventMqtt = new EventEmitter();

const configuration = { mqttUrl: 'fakeUrl', mqttUsername: 'username', mqttPassword: 'password' };

describe('zigbee2mqtt connect', () => {
  // PREPARE
  let zigbee2mqttManager;
  let gladys;
  let mqttLibrary;
  let mqttClient;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      event: {
        emit: fake.resolves(null),
      },
    };
    mqttClient = Object.assign(eventMqtt, {
      subscribe: fake.resolves(null),
      end: fake.resolves(null),
      removeAllListeners: fake.resolves(null),
    });
    mqttLibrary = {
      connect: fake.returns(mqttClient),
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('it should disconnect from mqtt', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = false;
    zigbee2mqttManager.mqttClient = mqttClient;
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    // ASSERT
    assert.notCalled(mqttLibrary.connect);
    assert.calledOnceWithExactly(mqttClient.end);
    assert.calledOnceWithExactly(mqttClient.removeAllListeners);
    expect(zigbee2mqttManager.mqttClient).to.eq(null);
  });

  it('it should not try to connect to mqtt', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = false;
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    // ASSERT
    assert.notCalled(mqttLibrary.connect);
    assert.notCalled(mqttClient.end);
    assert.notCalled(mqttClient.removeAllListeners);
  });

  it('it should try to connect to mqtt', async () => {
    // PREPARE
    zigbee2mqttManager.mqttRunning = true;
    // EXECUTE
    await zigbee2mqttManager.connect(configuration);
    // ASSERT
    // TODO: check parameters
    assert.calledOnce(mqttLibrary.connect);
    assert.notCalled(mqttClient.end);
    assert.notCalled(mqttClient.removeAllListeners);
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
    expect(zigbee2mqttManager.gladysConnected).to.equal(true);
    assert.calledWith(mqttClient.subscribe, 'zigbee2mqtt/#');
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
    expect(zigbee2mqttManager.gladysConnected).to.equal(false);
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
    expect(zigbee2mqttManager.gladysConnected).to.equal(false);
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
