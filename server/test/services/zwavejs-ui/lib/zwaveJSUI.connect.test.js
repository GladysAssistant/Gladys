const sinon = require('sinon');
const Promise = require('bluebird');

const { assert: chaiAssert } = require('chai');

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  variable: {
    getValue: fake.resolves('toto'),
  },
  event: {
    emit: fake.returns(null),
  },
};

describe('zwaveJSUIHandler.connect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not connect, mqttUrl not defined', async () => {
    const gladysNotConfigured = {
      variable: {
        getValue: fake.resolves(null),
      },
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladysNotConfigured, {}, serviceId);
    await chaiAssert.isRejected(zwaveJSUIHandler.connect());
  });

  it('should connect to MQTT broker with success', async () => {
    const mqttClient = {
      end: fake.returns(null),
      removeAllListeners: fake.returns(null),
      subscribe: fake.returns(null),
      on: (event, cb) => {
        if (event === 'connect') {
          cb();
        }
      },
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    await zwaveJSUIHandler.connect();
    assert.calledThrice(gladys.variable.getValue);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.CONNECTED,
    });
  });
  it('should connect to MQTT broker with error', async () => {
    const error = new Error('test-error');
    let mqttClient;
    const waitForCallBackToBeCalled = new Promise((resolve) => {
      mqttClient = {
        end: fake.returns(null),
        removeAllListeners: fake.returns(null),
        on: (event, cb) => {
          if (event === 'error') {
            setTimeout(() => {
              cb(error);
              resolve();
            }, 0);
          }
        },
      };
    });
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    await zwaveJSUIHandler.connect();
    await waitForCallBackToBeCalled;
    assert.calledThrice(gladys.variable.getValue);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.ERROR,
      payload: error,
    });
  });
  it('should connect to MQTT broker and get offline', async () => {
    const mqttClient = {
      end: fake.returns(null),
      removeAllListeners: fake.returns(null),
      on: (event, cb) => {
        if (event === 'offline') {
          cb();
        }
      },
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    await zwaveJSUIHandler.connect();
    assert.calledThrice(gladys.variable.getValue);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.ERROR,
      payload: 'DISCONNECTED',
    });
  });

  it('should handleMessage on message', async () => {
    const mqttClient = {
      end: fake.returns(null),
      removeAllListeners: fake.returns(null),
      on: (event, cb) => {
        if (event === 'message') {
          cb('', '');
        }
      },
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    const sut = sinon.stub(zwaveJSUIHandler, 'handleNewMessage').resolves();
    await zwaveJSUIHandler.connect();

    assert.calledOnce(sut);
  });
});
