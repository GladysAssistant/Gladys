const sinon = require('sinon');

const { expect } = require('chai');

const { assert, fake } = sinon;
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();

const { CONFIGURATION, DEFAULT } = require('../../../../../services/zwave-js-ui/lib/constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';
const DRIVER_PATH = 'DRIVER_PATH';

const { connect } = proxyquire('../../../../../services/zwave-js-ui/lib/commands/connect', {
  '../../../../utils/password': { generate: fake.returns('********') },
});
const disconnectMock = fake.returns(true);
const installMqttContainerMock = fake.resolves(true);
const installZwaveJSUIContainerMock = fake.resolves(true);
const handleMqttMessageMock = fake.returns(true);
const ZwaveJSUIManager = proxyquire('../../../../../services/zwave-js-ui/lib', {
  './commands/installMqttContainer': { installMqttContainer: installMqttContainerMock },
  './commands/installZwaveJSUIContainer': { installZwaveJSUIContainer: installZwaveJSUIContainerMock },
  './events/handleMqttMessage': { handleMqttMessage: handleMqttMessageMock },
  './commands/connect': { connect },
  './commands/disconnect': { disconnect: disconnectMock },
});

const event = {
  emit: fake.resolves(null),
};

const eventMqtt = new EventEmitter();

const mqttClient = Object.assign(eventMqtt, {
  subscribe: fake.resolves(null),
  publish: fake.returns(true),
  end: fake.resolves(true),
  removeAllListeners: fake.resolves(true),
});

const mqtt = {
  connect: fake.returns(mqttClient),
};

describe('zwaveJSUIManager connect', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      event,
      service: {
        getService: () => {
          return {
            list: () =>
              Promise.resolve([
                {
                  path: DRIVER_PATH,
                },
              ]),
          };
        },
      },
      variable: {
        getValue: fake.resolves(true),
        setValue: fake.resolves(true),
      },
      system: {
        isDocker: fake.resolves(true),
      },
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
  });

  beforeEach(() => {
    sinon.reset();
    zwaveJSUIManager.mqttExist = false;
    zwaveJSUIManager.mqttRunning = false;
    zwaveJSUIManager.mqttConnected = false;
    zwaveJSUIManager.zwaveJSUIExist = false;
    zwaveJSUIManager.zwaveJSUIRunning = false;
    zwaveJSUIManager.scanInProgress = false;
    zwaveJSUIManager.usbConfigured = false;
  });

  it('should connect to zwave-js-ui gladys instance as default', async () => {
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onCall(0) // EXTERNAL_ZWAVEJSUI
      .resolves(null)
      .onCall(1) // MQTT_PASSWORD
      .resolves(null)
      .onCall(2) // MQTT_URL
      .resolves('MQTT_URL')
      .onCall(3) // MQTT_USERNAME
      .resolves('MQTT_USERNAME')
      .onCall(4) // DRIVER_PATH
      .resolves(null);

    await zwaveJSUIManager.connect();

    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.mqttExist).to.equal(false);
    expect(zwaveJSUIManager.mqttRunning).to.equal(false);
    expect(zwaveJSUIManager.zwaveJSUIExist).to.equal(false);
    expect(zwaveJSUIManager.zwaveJSUIRunning).to.equal(false);

    // expect(password.generate()).;

    assert.calledWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.EXTERNAL_ZWAVEJSUI,
      DEFAULT.EXTERNAL_ZWAVEJSUI ? '1' : '0',
      ZWAVEJSUI_SERVICE_ID,
    );
    assert.calledWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.ZWAVEJSUI_MQTT_URL,
      DEFAULT.ZWAVEJSUI_MQTT_URL_VALUE,
      ZWAVEJSUI_SERVICE_ID,
    );
    assert.calledWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME,
      DEFAULT.ZWAVEJSUI_MQTT_USERNAME_VALUE,
      ZWAVEJSUI_SERVICE_ID,
    );
    assert.calledWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD,
      '********',
      ZWAVEJSUI_SERVICE_ID,
    );
  });

  it('should connect to zwave-js-ui external instance', async () => {
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJSUI
      .resolves('1')
      .onSecondCall() // DRIVER_PATH
      .resolves(DRIVER_PATH);

    await zwaveJSUIManager.connect();
    zwaveJSUIManager.mqttClient.emit('connect');

    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.calledOnce(mqtt.connect);
    assert.calledWith(mqttClient.subscribe, 'zwave-js-ui/#');
    expect(zwaveJSUIManager.mqttConnected).to.equal(true);
    expect(zwaveJSUIManager.mqttExist).to.equal(true);
    expect(zwaveJSUIManager.mqttRunning).to.equal(true);
    expect(zwaveJSUIManager.zwaveJSUIExist).to.equal(true);
    expect(zwaveJSUIManager.zwaveJSUIRunning).to.equal(true);
  });

  it('should connect to zwave-js-ui gladys instance no driver', async () => {
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onCall(0) // EXTERNAL_ZWAVEJSUI
      .resolves('0')
      .onCall(1) // MQTT_PASSWORD
      .resolves('MQTT_PASSWORD')
      .onCall(2) // MQTT_URL
      .resolves('MQTT_URL')
      .onCall(3) // MQTT_USERNAME
      .resolves('MQTT_USERNAME')
      .onCall(4) // DRIVER_PATH
      .resolves(null);

    await zwaveJSUIManager.connect();

    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.mqttExist).to.equal(false);
    expect(zwaveJSUIManager.mqttRunning).to.equal(false);
    expect(zwaveJSUIManager.zwaveJSUIExist).to.equal(false);
    expect(zwaveJSUIManager.zwaveJSUIRunning).to.equal(false);
  });

  it('should connect to zwave-js-ui gladys instance driver set', async () => {
    zwaveJSUIManager.mqttExist = true;
    zwaveJSUIManager.mqttRunning = true;
    zwaveJSUIManager.zwaveJSUIExist = true;
    zwaveJSUIManager.zwaveJSUIRunning = true;
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJSUI
      .resolves('0')
      .onSecondCall() // MQTT_PASSWORD
      .resolves('MQTT_PASSWORD')
      .onThirdCall() // DRIVER_PATH
      .resolves('DRIVER_PATH')
      .onCall(7) // MQTT_URL
      .resolves('MQTT_URL')
      .onCall(8) // MQTT_USERNAME
      .resolves('MQTT_USERNAME');

    await zwaveJSUIManager.connect();
    zwaveJSUIManager.mqttClient.emit('connect');
    assert.calledOnce(zwaveJSUIManager.installMqttContainer);
    assert.calledOnce(zwaveJSUIManager.installZwaveJSUIContainer);

    assert.calledTwice(zwaveJSUIManager.eventManager.emit);
    assert.calledOnce(mqtt.connect);
    assert.calledWith(mqttClient.subscribe, 'zwave-js-ui/#');
    expect(zwaveJSUIManager.mqttConnected).to.equal(true);
    expect(zwaveJSUIManager.mqttExist).to.equal(true);
    expect(zwaveJSUIManager.mqttRunning).to.equal(true);
    expect(zwaveJSUIManager.zwaveJSUIExist).to.equal(true);
    expect(zwaveJSUIManager.zwaveJSUIRunning).to.equal(true);
  });
});

describe('zwaveJSUIManager mqtt event', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      event,
      service: {
        getService: () => {
          return {
            list: () =>
              Promise.resolve([
                {
                  path: DRIVER_PATH,
                },
              ]),
          };
        },
      },
      variable: {
        getValue: fake.resolves(true),
        setValue: fake.resolves(true),
      },
      system: {
        isDocker: fake.resolves(true),
      },
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.installMqttContainer = fake.returns(true);
    zwaveJSUIManager.installZwaveJSUIContainer = fake.returns(true);
  });

  beforeEach(() => {
    sinon.reset();
    zwaveJSUIManager.mqttExist = true;
    zwaveJSUIManager.mqttRunning = true;
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.zwaveJSUIExist = true;
    zwaveJSUIManager.zwaveJSUIRunning = true;
    zwaveJSUIManager.scanInProgress = false;
    zwaveJSUIManager.usbConfigured = true;
  });

  it('should handle MQTT error event', async () => {
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJSUI
      .resolves('1')
      .onSecondCall() // DRIVER_PATH
      .resolves(DRIVER_PATH);

    await zwaveJSUIManager.connect();
    zwaveJSUIManager.mqttClient.emit('error', 'An error occured');

    assert.calledWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.MQTT_ERROR,
      payload: 'An error occured',
    });
    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.scanInProgress).to.equal(false);
  });

  it('should handle MQTT authentication error event', async () => {
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJSUI
      .resolves('1')
      .onSecondCall() // DRIVER_PATH
      .resolves(DRIVER_PATH);

    await zwaveJSUIManager.connect();
    zwaveJSUIManager.mqttClient.emit('error', { code: 5 });

    assert.calledWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.MQTT_ERROR,
      payload: { code: 5 },
    });
    assert.called(zwaveJSUIManager.disconnect);
    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.scanInProgress).to.equal(false);
  });

  it('should handle MQTT offline event', async () => {
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJSUI
      .resolves('1')
      .onSecondCall() // DRIVER_PATH
      .resolves(DRIVER_PATH);

    await zwaveJSUIManager.connect();
    zwaveJSUIManager.mqttClient.emit('offline');

    assert.calledWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.MQTT_ERROR,
      payload: 'DISCONNECTED',
    });
    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.scanInProgress).to.equal(false);
  });

  it('should handle MQTT message event', async () => {
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJSUI
      .resolves('1')
      .onSecondCall() // DRIVER_PATH
      .resolves(DRIVER_PATH);

    await zwaveJSUIManager.connect();
    zwaveJSUIManager.mqttClient.emit('message', 'topic', Buffer.from('{}'));

    assert.calledWithExactly(zwaveJSUIManager.handleMqttMessage, 'topic', '{}');
  });
});
