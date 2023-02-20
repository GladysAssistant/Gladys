const sinon = require('sinon');

const { assert, fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const { installZwaveJSUIContainer } = proxyquire(
  '../../../../../services/zwave-js-ui/lib/commands/installZwaveJSUIContainer',
  {
    '../../../../utils/childProcess': { exec: fake.resolves(true) },
  },
);
const ZwaveJSUIManager = proxyquire('../../../../../services/zwave-js-ui/lib', {
  './commands/installZwaveJSUIContainer': { installZwaveJSUIContainer },
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
    getContainerDevices: fake.resolves([]),
    exec: fake.resolves(true),
    getGladysBasePath: fake.resolves({
      basePathOnHost: '/var/lib/gladysassistant',
      basePathOnContainer: '/var/lib/gladysassistant',
    }),
  },
};

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';

describe('zwave-js-ui installZwaveJSUIContainer', () => {
  // PREPARE
  const zwaveJSUIManager = new ZwaveJSUIManager(gladys, null, ZWAVEJSUI_SERVICE_ID);

  beforeEach(() => {
    sinon.reset();
    zwaveJSUIManager.zwaveJSUIRunning = false;
    zwaveJSUIManager.zwaveJSUIExist = false;
  });

  it('it should restart ZwaveJSUI container', async function Test() {
    // PREPARE
    this.timeout(11000);

    // EXECUTE
    await zwaveJSUIManager.installZwaveJSUIContainer();

    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.match(zwaveJSUIManager.zwaveJSUIRunning, true);
    assert.match(zwaveJSUIManager.zwaveJSUIExist, true);
  });

  it('it should update container and restart', async function Test() {
    // PREPARE
    this.timeout(6000);
    gladys.system.getContainers = fake.resolves([container]);

    // EXECUTE
    await zwaveJSUIManager.installZwaveJSUIContainer();

    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.match(zwaveJSUIManager.zwaveJSUIRunning, true);
    assert.match(zwaveJSUIManager.zwaveJSUIExist, true);
  });

  it('it should fail to start ZwaveJSUI container', async function Test() {
    // PREPARE
    this.timeout(6000);
    gladys.system.getContainers = fake.resolves([containerStopped]);
    gladys.system.restartContainer = fake.throws(new Error('docker fail'));

    // EXECUTE
    try {
      await zwaveJSUIManager.installZwaveJSUIContainer();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'docker fail');
    }

    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.match(zwaveJSUIManager.zwaveJSUIRunning, false);
    assert.match(zwaveJSUIManager.zwaveJSUIExist, false);
    gladys.system.restartContainer = fake.resolves(true);
  });

  it('it should fail to install ZwaveJSUI container', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([]);
    gladys.system.pull = fake.throws(new Error('docker fail pull'));

    // EXECUTE
    try {
      await zwaveJSUIManager.installZwaveJSUIContainer();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'docker fail pull');
    }

    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.match(zwaveJSUIManager.zwaveJSUIRunning, false);
    assert.match(zwaveJSUIManager.zwaveJSUIExist, false);
  });

  it('it should install ZwaveJSUI container', async function Test() {
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
    await zwaveJSUIManager.installZwaveJSUIContainer();

    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.calledOnce(gladys.system.createContainer);
    assert.calledOnce(gladys.system.restartContainer);
    assert.match(zwaveJSUIManager.zwaveJSUIRunning, true);
    assert.match(zwaveJSUIManager.zwaveJSUIExist, true);
  });

  it('it should fail to configure ZwaveJSUI container', async function Test() {
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
      await zwaveJSUIManager.installZwaveJSUIContainer();
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
    assert.match(zwaveJSUIManager.zwaveJSUIRunning, false);
    assert.match(zwaveJSUIManager.zwaveJSUIExist, true);
  });
});
