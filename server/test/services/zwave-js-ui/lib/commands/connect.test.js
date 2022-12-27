const sinon = require('sinon');

const { expect } = require('chai');

const { assert, fake } = sinon;
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();

const { CONFIGURATION, DEFAULT } = require('../../../../../services/zwave-js-ui/lib/constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const { PlatformNotCompatible } = require('../../../../../utils/coreErrors');

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';
const DRIVER_PATH = 'DRIVER_PATH';

const { connect } = proxyquire('../../../../../services/zwave-js-ui/lib/commands/connect', {
  '../../../../utils/password': { generate: fake.returns('********') },
});
const ZwaveJSUIManager = proxyquire('../../../../../services/zwave-js-ui/lib', {
  './commands/connect': { connect },
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

describe('zwaveJSUIManager commands', () => {
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
    zwaveJSUIManager.installZ2mContainer = fake.returns(true);
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
    assert.calledWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD_BACKUP,
      '********',
      ZWAVEJSUI_SERVICE_ID,
    );
  });

  it('should fail connect to zwave-js-ui gladys instance on non docker system', async () => {
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

    gladys.system.isDocker = fake.resolves(false);

    let exc = null;
    try {
      await zwaveJSUIManager.connect();
    } catch (e) {
      exc = e;
    }

    expect(exc).to.not.equal(null);
    expect(exc).to.be.an.instanceof(PlatformNotCompatible);
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
      .onThirdCall() // MQTT_URL
      .resolves('MQTT_URL')
      .onCall(3) // MQTT_USERNAME
      .resolves('MQTT_USERNAME')
      .onCall(4) // DRIVER_PATH
      .resolves(DRIVER_PATH);

    await zwaveJSUIManager.connect();
    zwaveJSUIManager.mqttClient.emit('connect');
    assert.calledOnce(zwaveJSUIManager.installMqttContainer);
    assert.calledOnce(zwaveJSUIManager.installZ2mContainer);

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
