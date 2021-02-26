const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { stub } = require('sinon');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { installZ2mContainer } = proxyquire('../../../../services/zigbee2mqtt/lib/installZ2mContainer', {
  '../../../utils/childProcess': { exec: fake.resolves(true) },
});
const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {
  './installZ2mContainer': { installZ2mContainer },
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
  },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt installz2mContainer', () => {
  // PREPARE
  const zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);

  beforeEach(() => {
    sinon.reset();
    zigbee2mqttManager.zigbee2mqttRunning = false;
    zigbee2mqttManager.zigbee2mqttExist = false;
  });

  it('it should restart z2m container', async function Test() {
    // PREPARE
    this.timeout(6000);
    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer();
    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.match(zigbee2mqttManager.zigbee2mqttRunning, true);
    assert.match(zigbee2mqttManager.zigbee2mqttExist, true);
  });

  it('it should do nothing', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([container]);
    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer();
    // ASSERT
    assert.notCalled(gladys.system.restartContainer);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.match(zigbee2mqttManager.zigbee2mqttRunning, true);
    assert.match(zigbee2mqttManager.zigbee2mqttExist, true);
  });

  it('it should fail to start z2m container', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([containerStopped]);
    gladys.system.restartContainer = fake.throws(new Error('docker fail'));
    // EXECUTE
    try {
      await zigbee2mqttManager.installZ2mContainer();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'docker fail');
    }
    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.match(zigbee2mqttManager.zigbee2mqttRunning, false);
    assert.match(zigbee2mqttManager.zigbee2mqttExist, false);
  });

  it('it should fail to install z2m container', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([]);
    gladys.system.pull = fake.throws(new Error('docker fail pull'));
    // EXECUTE
    try {
      await zigbee2mqttManager.installZ2mContainer();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'docker fail pull');
    }
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.match(zigbee2mqttManager.zigbee2mqttRunning, false);
    assert.match(zigbee2mqttManager.zigbee2mqttExist, false);
  });

  it('it should install z2m container', async function Test() {
    // PREPARE
    const getContainersStub = stub();
    getContainersStub
      .onFirstCall()
      .resolves([])
      .onSecondCall()
      .resolves([container]);
    gladys.system.getContainers = getContainersStub;
    gladys.system.pull = fake.resolves(true);

    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer();
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.calledThrice(gladys.variable.getValue);
    assert.calledOnce(gladys.system.createContainer);
    assert.match(zigbee2mqttManager.zigbee2mqttRunning, true);
    assert.match(zigbee2mqttManager.zigbee2mqttExist, true);
  });
});
