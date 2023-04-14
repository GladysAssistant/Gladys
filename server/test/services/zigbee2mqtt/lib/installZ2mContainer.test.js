const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');

const { assert, fake, stub } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { installZ2mContainer } = proxyquire('../../../../services/zigbee2mqtt/lib/installZ2mContainer', {
  '../../../utils/childProcess': { exec: fake.resolves(true) },
});
const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {
  './installZ2mContainer': { installZ2mContainer },
});

const container = {
  id: 'docker-test',
  state: 'running',
};

const containerStopped = {
  id: 'docker-test',
  state: 'stopped',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt installz2mContainer', () => {
  // PREPARE
  let zigbee2mqttManager;
  let gladys;

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
      variable: {
        getValue: fake.resolves(null),
      },
      system: {
        getContainers: fake.resolves([containerStopped]),
        stopContainer: fake.resolves(true),
        pull: fake.resolves(true),
        restartContainer: fake.resolves(true),
        createContainer: fake.resolves(true),
        getGladysBasePath: fake.resolves({
          basePathOnHost: path.join(__dirname, 'host'),
          basePathOnContainer: path.join(__dirname, 'container'),
        }),
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.zigbee2mqttRunning = false;
    zigbee2mqttManager.zigbee2mqttExist = false;
    zigbee2mqttManager.containerRestartWaitTimeInMs = 0;
  });

  afterEach(() => {
    fs.rmSync(path.join(__dirname, 'host'), { force: true, recursive: true });
    fs.rmSync(path.join(__dirname, 'container'), { force: true, recursive: true });
    sinon.reset();
  });

  it('it should restart z2m container', async function test() {
    // PREPARE
    this.timeout(6000);
    const config = {};
    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer(config);
    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(true);
  });

  it('it should do nothing', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([container]);
    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer(config);
    // ASSERT
    assert.notCalled(gladys.system.restartContainer);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(true);
  });

  it('it should fail to start z2m container', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([containerStopped]);
    gladys.system.restartContainer = fake.throws(new Error('docker fail'));
    // EXECUTE
    try {
      await zigbee2mqttManager.installZ2mContainer(config);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('docker fail');
    }
    // ASSERT
    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(false);
  });

  it('it should fail to install z2m container', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([]);
    gladys.system.pull = fake.throws(new Error('docker fail pull'));
    // EXECUTE
    try {
      await zigbee2mqttManager.installZ2mContainer(config);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('docker fail pull');
    }
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(false);
  });

  it('it should install z2m container and error reading configuration', async () => {
    // PREPARE
    const config = {};
    const getContainersStub = stub();
    getContainersStub
      .onFirstCall()
      .resolves([])
      .onSecondCall()
      .resolves([container]);
    gladys.system.getContainers = getContainersStub;
    gladys.system.pull = fake.resolves(true);

    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer(config);
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.calledOnce(gladys.system.createContainer);
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(true);
    expect(config).to.deep.equal({});
  });
});
