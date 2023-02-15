const sinon = require('sinon');

const { expect } = require('chai');

const { assert, fake } = sinon;
const EventEmitter = require('events');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';
const DRIVER_PATH = 'DRIVER_PATH';

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
    zwaveJSUIManager.installZwaveJSUIContainer = fake.returns(true);
  });

  beforeEach(() => {
    sinon.reset();
  });

  it('should disconnect from zwave-js-ui external instance', async () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    await zwaveJSUIManager.disconnect();

    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.calledOnce(mqttClient.end);
    assert.calledOnce(mqttClient.removeAllListeners);
    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.scanInProgress).to.equal(false);
  });

  it('should disconnect again from zwave-js-ui external instance', async () => {
    zwaveJSUIManager.mqttConnected = false;

    await zwaveJSUIManager.disconnect();

    assert.notCalled(zwaveJSUIManager.eventManager.emit);
    assert.notCalled(mqttClient.end);
    assert.notCalled(mqttClient.removeAllListeners);
    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.scanInProgress).to.equal(false);
  });
});
