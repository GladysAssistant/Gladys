const sinon = require('sinon');

const { assert, fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const { installMqttContainer } = proxyquire('../../../../../services/zwave-js-ui/lib/commands/installMqttContainer', {
  '../../../../utils/childProcess': { exec: fake.resolves(true) },
});
const ZwaveJSUIManager = proxyquire('../../../../../services/zwave-js-ui/lib', {
  './commands/installMqttContainer': { installMqttContainer },
});

const event = {
  emit: fake.resolves(null),
};

const container = {
  id: 'docker-test',
  state: 'running',
};

const containerStopped = {
  id: 'docker-test',
  state: 'stopped',
};

const gladys = {
  event,
  variable: {
    setValue: fake.resolves(true),
    getValue: fake.resolves(true),
  },
  system: {
    getContainers: fake.resolves([containerStopped]),
    stopContainer: fake.resolves(true),
    pull: fake.resolves(true),
    restartContainer: fake.resolves(true),
    createContainer: fake.resolves(true),
    exec: fake.resolves(true),
    getGladysBasePath: fake.resolves({
      basePathOnHost: '/var/lib/gladysassistant',
      basePathOnContainer: '/var/lib/gladysassistant',
    }),
  },
};

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';

describe('zwave-js-ui installMqttContainer', () => {
  // PREPARE
  const zwaveJSUIManager = new ZwaveJSUIManager(gladys, null, ZWAVEJSUI_SERVICE_ID);

  beforeEach(() => {
    sinon.reset();
    zwaveJSUIManager.zwavejsuiRunning = false;
    zwaveJSUIManager.zwavejsuiExist = false;
  });

  it('it should restart MQTT container', async function Test() {
    // PREPARE
    this.timeout(6000);
    // EXECUTE
    await zwaveJSUIManager.installMqttContainer();
    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.match(zwaveJSUIManager.mqttRunning, true);
    assert.match(zwaveJSUIManager.mqttExist, true);
  });

  it('it should do nothing', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([container]);
    // EXECUTE
    await zwaveJSUIManager.installMqttContainer();
    // ASSERT
    assert.notCalled(gladys.system.restartContainer);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.match(zwaveJSUIManager.mqttRunning, true);
    assert.match(zwaveJSUIManager.mqttExist, true);
  });

  it('it should fail to start MQTT container', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([containerStopped]);
    gladys.system.restartContainer = fake.throws(new Error('docker fail'));
    // EXECUTE
    try {
      await zwaveJSUIManager.installMqttContainer();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'docker fail');
    }
    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.match(zwaveJSUIManager.mqttRunning, false);
    assert.match(zwaveJSUIManager.mqttExist, true);
    gladys.system.restartContainer = fake.resolves(true);
  });

  it('it should fail to install MQTT container', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([]);
    gladys.system.pull = fake.throws(new Error('docker fail pull'));
    // EXECUTE
    try {
      await zwaveJSUIManager.installMqttContainer();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'docker fail pull');
    }
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.match(zwaveJSUIManager.mqttRunning, false);
    assert.match(zwaveJSUIManager.mqttExist, false);
  });

  it('it should install MQTT container', async function Test() {
    // PREPARE
    this.timeout(11000);
    const getContainersStub = sinon.stub();
    getContainersStub
      .onFirstCall()
      .resolves([])
      .onSecondCall()
      .resolves([container]);
    gladys.system.getContainers = getContainersStub;
    gladys.system.pull = fake.resolves(true);

    // EXECUTE
    await zwaveJSUIManager.installMqttContainer();
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.calledOnce(gladys.system.createContainer);
    assert.calledTwice(gladys.system.restartContainer);
    assert.match(zwaveJSUIManager.mqttRunning, true);
    assert.match(zwaveJSUIManager.mqttExist, true);
  });
  it('it should fail to configure MQTT container', async function Test() {
    // PREPARE
    this.timeout(11000);
    const getContainersStub = sinon.stub();
    getContainersStub
      .onFirstCall()
      .resolves([])
      .onSecondCall()
      .resolves([container]);
    gladys.system.getContainers = getContainersStub;
    gladys.system.restartContainer = fake.throws(new Error('docker fail restart'));

    // EXECUTE
    try {
      await zwaveJSUIManager.installMqttContainer();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'docker fail restart');
    }
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.calledOnce(gladys.system.createContainer);
    assert.calledOnce(gladys.system.restartContainer);
    assert.match(zwaveJSUIManager.mqttRunning, false);
    assert.match(zwaveJSUIManager.mqttExist, true);
  });
});
