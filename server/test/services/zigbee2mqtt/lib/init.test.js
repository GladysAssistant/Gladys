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

  it('it should fail because not a Docker System', async () => {
    // PREPARE
    gladys.system.isDocker = fake.resolves(false);
    // EXECUTE
    try {
      await zigbee2mqttManager.init();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('SYSTEM_NOT_RUNNING_DOCKER');
    }
    // ASSERT
    expect(zigbee2mqttManager.dockerBased).to.equal(false);
    assert.notCalled(zigbee2mqttManager.getConfiguration);
    assert.notCalled(zigbee2mqttManager.saveConfiguration);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
  });

  it('it should fail because not a host network', async () => {
    // PREPARE
    gladys.system.getNetworkMode = fake.resolves('container');
    // EXECUTE
    try {
      await zigbee2mqttManager.init();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('DOCKER_BAD_NETWORK');
    }
    // ASSERT
    expect(zigbee2mqttManager.networkModeValid).to.equal(false);
    assert.notCalled(zigbee2mqttManager.getConfiguration);
    assert.notCalled(zigbee2mqttManager.saveConfiguration);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
  });

  it('it should not install containers, usb is not configured', async () => {
    // PREPARE
    const config = { mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnceWithExactly(zigbee2mqttManager.saveConfiguration, config);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
  });

  it('it should not install containers, usb port not found', async () => {
    // PREPARE
    const config = { z2mDriverPath: 'unknown/path', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnceWithExactly(zigbee2mqttManager.saveConfiguration, config);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
  });

  it('it should install containers, usb port is found', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });
    zigbee2mqttManager.isEnabled.returns(false);

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnceWithExactly(zigbee2mqttManager.saveConfiguration, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.checkForContainerUpdates, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.installMqttContainer, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.installZ2mContainer, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
  });

  it('it should save default mqtt params', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0' };
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
  });

  it('it should connect', async () => {
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
    assert.calledOnceWithExactly(zigbee2mqttManager.saveConfiguration, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.installMqttContainer, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.installZ2mContainer, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.isEnabled);
    assert.calledOnceWithExactly(zigbee2mqttManager.connect, config);
    assert.calledOnce(gladys.scheduler.scheduleJob);
  });

  it('it should connect and scheduler already there', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });
    zigbee2mqttManager.isEnabled.returns(true);
    zigbee2mqttManager.backupScheduledJob = 'this is not null';

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnceWithExactly(zigbee2mqttManager.saveConfiguration, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.checkForContainerUpdates, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.installMqttContainer, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.installZ2mContainer, config);
    assert.calledOnceWithExactly(zigbee2mqttManager.isEnabled);
    assert.calledOnceWithExactly(zigbee2mqttManager.connect, config);
  });
});
