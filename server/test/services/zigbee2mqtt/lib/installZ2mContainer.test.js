const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake, stub } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const configureContainer = fake.resolves(false);
const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {
  './configureContainer': { configureContainer },
});

const container = {
  id: 'docker-test',
  state: 'running',
};

const containerStopped = {
  id: 'docker-test',
  state: 'stopped',
};

const containerDescription = {
  Id: 'a8293feec54547a797aa2e52cc14b93f89a007d6c5608c587e30491feec8ee61',
  HostConfig: {
    NetworkMode: 'host',
    Devices: [
      {
        PathOnHost: '/dev/ttyUSB0',
        PathInContainer: '/dev/ttyACM0',
        CgroupPermissions: 'rwm',
      },
    ],
  },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const basePathOnContainer = path.join(__dirname, 'container');

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
        inspectContainer: fake.resolves(containerDescription),
        stopContainer: fake.resolves(true),
        pull: fake.resolves(true),
        restartContainer: fake.resolves(true),
        removeContainer: fake.resolves(true),
        createContainer: fake.resolves(true),
        getGladysBasePath: fake.resolves({
          basePathOnHost: path.join(__dirname, 'host'),
          basePathOnContainer,
        }),
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.dockerBased = true;
    zigbee2mqttManager.networkModeValid = true;
    zigbee2mqttManager.zigbee2mqttRunning = false;
    zigbee2mqttManager.zigbee2mqttExist = false;
    zigbee2mqttManager.containerRestartWaitTimeInMs = 0;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should restart z2m container (container stopped)', async () => {
    // PREPARE
    const config = {};
    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer(config);
    // ASSERT
    assert.calledOnceWithExactly(configureContainer, basePathOnContainer, config, false);
    assert.calledOnceWithExactly(gladys.system.restartContainer, container.id);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: false,
      },
    });
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(true);
  });

  it('should restart z2m container (container running but config changed)', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([container]);
    zigbee2mqttManager.configureContainer = fake.resolves(true);
    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer(config);
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.configureContainer, basePathOnContainer, config, false);
    assert.calledOnceWithExactly(gladys.system.restartContainer, container.id);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: true,
      },
    });
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(true);
  });

  it('should do nothing', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([container]);
    // EXECUTE
    await zigbee2mqttManager.installZ2mContainer(config);
    // ASSERT
    assert.notCalled(gladys.system.restartContainer);
    assert.calledOnceWithExactly(configureContainer, basePathOnContainer, config, false);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: true,
      },
    });
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(true);
  });

  it('it should fail to start z2m container', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0' };
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
    assert.calledOnceWithExactly(configureContainer, basePathOnContainer, config, false);
    assert.calledOnceWithExactly(gladys.system.restartContainer, container.id);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
      },
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
    assert.notCalled(configureContainer);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
      },
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
    assert.calledTwice(gladys.event.emit);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: true,
      },
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: false,
      },
    });
    assert.calledOnceWithExactly(configureContainer, basePathOnContainer, config, false);
    assert.calledOnce(gladys.system.createContainer);
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(true);
    expect(config).to.deep.equal({});
  });
});
