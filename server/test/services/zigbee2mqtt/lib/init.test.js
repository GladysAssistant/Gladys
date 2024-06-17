const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const container = {
  id: 'docker-test',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt init', () => {
  // PREPARE
  let zigbee2mqttManager;
  let gladys;
  let clock;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      system: {
        getContainers: fake.resolves([container]),
        stopContainer: fake.resolves(true),
        isDocker: fake.resolves(true),
        getNetworkMode: fake.resolves('host'),
        restartContainer: fake.resolves(true),
      },
      service: {
        getService: fake.returns({
          list: fake.resolves([
            {
              path: '/dev/ttyUSB0',
            },
          ]),
        }),
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, {}, serviceId);

    zigbee2mqttManager.getConfiguration = sinon.stub();
    zigbee2mqttManager.saveConfiguration = sinon.stub();
    zigbee2mqttManager.checkForContainerUpdates = sinon.stub();
    zigbee2mqttManager.installMqttContainer = sinon.stub();
    zigbee2mqttManager.installZ2mContainer = sinon.stub();
    zigbee2mqttManager.emitStatusEvent = sinon.stub();
    zigbee2mqttManager.isEnabled = sinon.stub();
    zigbee2mqttManager.connect = sinon.stub();

    zigbee2mqttManager.dockerBased = undefined;
    zigbee2mqttManager.networkModeValid = undefined;
    zigbee2mqttManager.usbConfigured = undefined;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should fail because not a Docker System', async () => {
    // PREPARE
    gladys.system.isDocker = fake.resolves(false);
    zigbee2mqttManager.getConfiguration = fake.resolves({
      mqttMode: 'local',
    });
    // EXECUTE
    try {
      await zigbee2mqttManager.init();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('SYSTEM_NOT_RUNNING_DOCKER');
    }
    // ASSERT
    expect(zigbee2mqttManager.dockerBased).to.equal(false);
    assert.calledOnce(zigbee2mqttManager.getConfiguration);
    assert.notCalled(zigbee2mqttManager.saveConfiguration);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
    assert.notCalled(zigbee2mqttManager.emitStatusEvent);
  });

  it('should init system in remote mode', async () => {
    // PREPARE
    gladys.system.isDocker = fake.resolves(false);
    zigbee2mqttManager.getConfiguration = fake.resolves({
      mqttMode: 'external',
    });
    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    expect(zigbee2mqttManager.dockerBased).to.equal(false);
    assert.calledOnce(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.calledOnce(zigbee2mqttManager.connect);
    assert.called(zigbee2mqttManager.emitStatusEvent);
  });

  it('should fail because not a host network', async () => {
    // PREPARE
    gladys.system.getNetworkMode = fake.resolves('container');
    zigbee2mqttManager.getConfiguration = fake.resolves({
      mqttMode: 'local',
    });
    // EXECUTE
    try {
      await zigbee2mqttManager.init();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('DOCKER_BAD_NETWORK');
    }
    // ASSERT
    expect(zigbee2mqttManager.networkModeValid).to.equal(false);
    assert.calledOnce(zigbee2mqttManager.getConfiguration);
    assert.notCalled(zigbee2mqttManager.saveConfiguration);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
    assert.calledOnceWithExactly(zigbee2mqttManager.emitStatusEvent);
  });

  it('should not install containers, usb is not configured', async () => {
    // PREPARE
    const config = { mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  it('should not install containers, usb port not found', async () => {
    // PREPARE
    const config = { z2mDriverPath: 'unknown/path', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  it('should install containers, usb port is found', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });
    zigbee2mqttManager.isEnabled.returns(false);

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnce(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.calledOnce(zigbee2mqttManager.checkForContainerUpdates);
    assert.calledOnce(zigbee2mqttManager.installMqttContainer);
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.calledOnce(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  it('should save default mqtt params', async () => {
    // PREPARE
    const config = { mqttMode: 'local', z2mDriverPath: '/dev/ttyUSB0' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });
    zigbee2mqttManager.isEnabled.returns(false);

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    const expectedNewConfig = {
      mqttUrl: 'mqtt://localhost:1884',
      z2mMqttUsername: 'z2m',
      mqttUsername: 'gladys',
      z2mDriverPath: '/dev/ttyUSB0',
    };

    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.calledWithMatch(zigbee2mqttManager.saveConfiguration, sinon.match(expectedNewConfig));
    assert.calledOnce(zigbee2mqttManager.checkForContainerUpdates);
    assert.calledWithMatch(zigbee2mqttManager.checkForContainerUpdates, sinon.match(expectedNewConfig));
    assert.calledOnce(zigbee2mqttManager.installMqttContainer);
    assert.calledWithMatch(zigbee2mqttManager.installMqttContainer, sinon.match(expectedNewConfig));
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.calledWithMatch(zigbee2mqttManager.installZ2mContainer, sinon.match(expectedNewConfig));
    assert.calledOnceWithExactly(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  it('should connect', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });
    zigbee2mqttManager.isEnabled.returns(true);

    gladys.scheduler = {
      scheduleJob: fake.returns(true),
    };

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.calledOnce(zigbee2mqttManager.installMqttContainer);
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.calledOnce(zigbee2mqttManager.isEnabled);
    assert.calledOnce(zigbee2mqttManager.connect);
    assert.calledOnce(gladys.scheduler.scheduleJob);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  it('should connect and scheduler already there', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });
    zigbee2mqttManager.isEnabled.returns(true);
    zigbee2mqttManager.backupScheduledJob = 'this is not null';

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.calledOnce(zigbee2mqttManager.checkForContainerUpdates);
    assert.calledOnce(zigbee2mqttManager.installMqttContainer);
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.calledOnce(zigbee2mqttManager.isEnabled);
    assert.calledOnce(zigbee2mqttManager.connect);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });
});
