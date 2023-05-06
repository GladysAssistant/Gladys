const { expect } = require('chai');
const sinon = require('sinon');
const { promises: fs } = require('fs');

const { assert, fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { installMqttContainer } = proxyquire('../../../../services/zigbee2mqtt/lib/installMqttContainer', {});
const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {
  './installMqttContainer': { installMqttContainer },
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

describe('zigbee2mqtt installMqttContainer', () => {
  const TEMP_GLADYS_FOLDER = process.env.TEMP_FOLDER || '../.tmp';
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
      system: {
        getContainers: fake.resolves([containerStopped]),
        stopContainer: fake.resolves(true),
        pull: fake.resolves(true),
        restartContainer: fake.resolves(true),
        createContainer: fake.resolves(true),
        exec: fake.resolves(true),
        getGladysBasePath: fake.resolves({
          basePathOnHost: '/var/lib/gladysassistant',
          basePathOnContainer: TEMP_GLADYS_FOLDER,
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

  it('should restart MQTT container', async function Test() {
    // PREPARE
    this.timeout(6000);
    const config = {};
    // EXECUTE
    await zigbee2mqttManager.installMqttContainer(config);
    // ASSERT
    assert.calledOnceWithExactly(gladys.system.restartContainer, container.id);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
        mqttRunning: true,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
      },
    });
    expect(zigbee2mqttManager.mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.mqttExist).to.equal(true);
  });

  it('should do nothing', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([container]);
    // EXECUTE
    await zigbee2mqttManager.installMqttContainer(config);
    // ASSERT
    assert.notCalled(gladys.system.restartContainer);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
        mqttRunning: true,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
      },
    });
    expect(zigbee2mqttManager.mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.mqttExist).to.equal(true);
  });

  it('should fail to start MQTT container', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([containerStopped]);
    gladys.system.restartContainer = fake.throws(new Error('docker fail'));
    // EXECUTE
    try {
      await zigbee2mqttManager.installMqttContainer(config);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('docker fail');
    }
    // ASSERT
    assert.calledOnceWithExactly(gladys.system.restartContainer, container.id);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
      },
    });
    expect(zigbee2mqttManager.mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.mqttExist).to.equal(true);
  });

  it('should fail to install MQTT container', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([]);
    gladys.system.pull = fake.throws(new Error('docker fail pull'));
    // EXECUTE
    try {
      await zigbee2mqttManager.installMqttContainer(config);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('docker fail pull');
    }
    // ASSERT
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
    expect(zigbee2mqttManager.mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.mqttExist).to.equal(false);
  });

  it('should install MQTT container', async function Test() {
    // PREPARE
    const config = {};
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
    await zigbee2mqttManager.installMqttContainer(config);
    // ASSERT
    assert.calledTwice(gladys.event.emit);
    // 1st call - setup mqtt
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
      },
    });
    // 2nd call - mqtt is ready
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
        mqttRunning: true,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
      },
    });
    assert.calledOnce(gladys.system.createContainer);
    assert.calledTwice(gladys.system.restartContainer);
    expect(zigbee2mqttManager.mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.mqttExist).to.equal(true);
    const mosquittoConfPath = `${TEMP_GLADYS_FOLDER}/zigbee2mqtt/mqtt/mosquitto.conf`;
    const mosquittoConfContent = await fs.readFile(mosquittoConfPath, 'utf-8');
    expect(mosquittoConfContent).to.contain('listener 1884');
    expect(mosquittoConfContent).to.contain('allow_anonymous false');
    expect(mosquittoConfContent).to.contain('password_file /mosquitto/config/mosquitto.passwd');
    expect(mosquittoConfContent).to.contain('persistence true');
    expect(mosquittoConfContent).to.contain('persistence_location /mosquitto/config/');
    const mosquittoPwdPath = `${TEMP_GLADYS_FOLDER}/zigbee2mqtt/mqtt/mosquitto.passwd`;
    const mosquittoPwdContent = await fs.readFile(mosquittoPwdPath, 'utf-8');
    expect(mosquittoPwdContent).to.equal('');
  });
  it('should fail to configure MQTT container', async function Test() {
    // PREPARE
    this.timeout(11000);
    const config = {};
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
      await zigbee2mqttManager.installMqttContainer(config);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('docker fail restart');
    }
    // ASSERT
    assert.calledTwice(gladys.event.emit);
    assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
      },
    });
    assert.calledOnce(gladys.system.createContainer);
    assert.calledOnce(gladys.system.restartContainer);
    expect(zigbee2mqttManager.mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.mqttExist).to.equal(true);
  });
});
