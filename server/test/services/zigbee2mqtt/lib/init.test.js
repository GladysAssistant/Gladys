const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;

const logger = require('../../../../utils/logger');
const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { DEFAULT } = require('../../../../services/zigbee2mqtt/lib/constants');

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
    zigbee2mqttManager.pullMissingImages = sinon.stub();
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

  it('should end a pending startup and stop asking Zigbee2mqtt whether it runs', async () => {
    // PREPARE
    const startingTimeout = fake();
    const healthCheckRetry = fake();
    zigbee2mqttManager.zigbee2mqttStarting = true;
    zigbee2mqttManager.startingTimer = setTimeout(startingTimeout, 1000);
    zigbee2mqttManager.healthCheckTimer = setTimeout(healthCheckRetry, 1000);
    gladys.system.isDocker = fake.resolves(false);
    zigbee2mqttManager.getConfiguration = fake.resolves({ mqttMode: 'local' });
    // EXECUTE
    await zigbee2mqttManager.init().catch(() => {});
    clock.tick(1000);
    // ASSERT
    assert.notCalled(startingTimeout);
    assert.notCalled(healthCheckRetry);
    expect(zigbee2mqttManager.startingTimer).to.equal(null);
    expect(zigbee2mqttManager.healthCheckTimer).to.equal(null);
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(false);
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
    assert.notCalled(zigbee2mqttManager.pullMissingImages);
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

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnce(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.calledOnceWithExactly(zigbee2mqttManager.pullMissingImages);
    assert.calledOnce(zigbee2mqttManager.checkForContainerUpdates);
    assert.calledOnce(zigbee2mqttManager.installMqttContainer);
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    // The images are there before a container is replaced by a new version
    assert.callOrder(
      zigbee2mqttManager.pullMissingImages,
      zigbee2mqttManager.checkForContainerUpdates,
      zigbee2mqttManager.installMqttContainer,
      zigbee2mqttManager.installZ2mContainer,
    );
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  it('should log how long the installation of the containers takes', async () => {
    // PREPARE
    const infoStub = sinon.stub(logger, 'info');
    zigbee2mqttManager.getConfiguration.resolves({ z2mDriverPath: '/dev/ttyUSB0', mqttPassword: 'mqttPassword' });
    zigbee2mqttManager.installZ2mContainer.callsFake(() => clock.tick(102400));
    // EXECUTE
    try {
      await zigbee2mqttManager.init();
    } finally {
      infoStub.restore();
    }
    // ASSERT
    assert.calledWithExactly(infoStub, 'Zigbee2mqtt: containers installed and started in 1 min 42 s');
  });

  it('should not install containers, network coordinator not configured', async () => {
    // PREPARE
    const config = { z2mAdapterMode: 'network', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    expect(zigbee2mqttManager.networkAdapterConfigured).to.equal(false);
    assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
    assert.notCalled(zigbee2mqttManager.installMqttContainer);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.connect);
  });

  it('should install containers, network coordinator is configured', async () => {
    // PREPARE
    const config = {
      z2mAdapterMode: 'network',
      z2mNetworkAdapterUrl: 'tcp://192.168.1.20:6638',
      mqttPassword: 'mqttPassword',
    };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    expect(zigbee2mqttManager.networkAdapterConfigured).to.equal(true);
    expect(zigbee2mqttManager.usbConfigured).to.equal(false);
    // The USB service is not requested in network mode
    assert.notCalled(gladys.service.getService);
    assert.calledOnce(zigbee2mqttManager.checkForContainerUpdates);
    assert.calledOnce(zigbee2mqttManager.installMqttContainer);
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
  });

  it('should save default mqtt params', async () => {
    // PREPARE
    const config = { mqttMode: 'local', z2mDriverPath: '/dev/ttyUSB0' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });

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
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.notCalled(zigbee2mqttManager.connect);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  it('should connect', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });
    // The broker runs, Zigbee2mqtt is not online yet: Gladys must connect to the broker to hear it
    zigbee2mqttManager.installMqttContainer.callsFake(() => {
      zigbee2mqttManager.mqttRunning = true;
    });
    zigbee2mqttManager.isEnabled.returns(false);

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
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.calledOnce(zigbee2mqttManager.connect);
    assert.calledOnce(gladys.scheduler.scheduleJob);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  it('should connect and scheduler already there', async () => {
    // PREPARE
    const config = { z2mDriverPath: '/dev/ttyUSB0', mqttPassword: 'mqttPassword' };
    zigbee2mqttManager.getConfiguration.resolves({ ...config });
    // The broker runs, Zigbee2mqtt is not online yet: Gladys must connect to the broker to hear it
    zigbee2mqttManager.installMqttContainer.callsFake(() => {
      zigbee2mqttManager.mqttRunning = true;
    });
    zigbee2mqttManager.isEnabled.returns(false);
    zigbee2mqttManager.backupScheduledJob = 'this is not null';

    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.getConfiguration);
    assert.calledOnce(zigbee2mqttManager.saveConfiguration);
    assert.calledOnce(zigbee2mqttManager.checkForContainerUpdates);
    assert.calledOnce(zigbee2mqttManager.installMqttContainer);
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.notCalled(zigbee2mqttManager.isEnabled);
    assert.calledOnce(zigbee2mqttManager.connect);
    assert.calledThrice(zigbee2mqttManager.emitStatusEvent);
  });

  describe('when the version of the Zigbee2mqtt container changed', () => {
    // Created by a previous version of the descriptor
    const z2mContainer = {
      id: 'old-z2m',
      name: '/gladys-z2m-zigbee2mqtt',
      state: 'running',
      labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
    };
    // Resolve with the error given to finishInstallation, null on success
    let finished;

    beforeEach(() => {
      zigbee2mqttManager.getConfiguration.resolves({
        z2mDriverPath: '/dev/ttyUSB0',
        mqttPassword: 'mqttPassword',
        dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
        dockerZ2mVersion: '12',
      });
      gladys.system.getContainers = fake(({ filters }) =>
        Promise.resolve(filters.name[0] === 'gladys-z2m-zigbee2mqtt' ? [z2mContainer] : []),
      );
      zigbee2mqttManager.emitInstallProgress = sinon.stub();
      zigbee2mqttManager.waitForZigbee2mqtt = sinon.stub().resolves();
      finished = new Promise((resolve) => {
        zigbee2mqttManager.finishInstallation = fake(resolve);
      });
      sinon.stub(logger, 'error');
      sinon.stub(logger, 'warn');
    });

    afterEach(() => {
      logger.error.restore();
      logger.warn.restore();
    });

    it('should follow the update like an installation, without waiting for Zigbee2mqtt', async () => {
      // PREPARE
      let answer;
      zigbee2mqttManager.waitForZigbee2mqtt = sinon.stub().returns(
        new Promise((resolve) => {
          answer = resolve;
        }),
      );
      sinon.spy(zigbee2mqttManager, 'startInstallation');
      // EXECUTE
      await zigbee2mqttManager.init();
      // ASSERT
      expect(zigbee2mqttManager.installation.state).to.equal('running');
      expect(zigbee2mqttManager.installation.kind).to.equal('update');
      // Followed from the download of the new image
      assert.calledOnceWithExactly(zigbee2mqttManager.startInstallation, 'update');
      assert.callOrder(zigbee2mqttManager.startInstallation, zigbee2mqttManager.pullMissingImages);
      // The service started, Zigbee2mqtt has not answered yet
      assert.calledOnceWithExactly(zigbee2mqttManager.waitForZigbee2mqtt);
      assert.notCalled(zigbee2mqttManager.finishInstallation);
      // Without a job
      expect(zigbee2mqttManager.installationJobId).to.equal(null);
      answer();
      expect(await finished).to.equal(null);
    });

    it('should tell a failed update when Zigbee2mqtt does not start', async () => {
      // PREPARE
      const error = new Error('Zigbee2mqtt failed to start: NO_ANSWER');
      zigbee2mqttManager.waitForZigbee2mqtt = sinon.stub().rejects(error);
      // EXECUTE
      await zigbee2mqttManager.init();
      // ASSERT
      expect(await finished).to.equal(error);
      assert.calledWithExactly(logger.error, 'Zigbee2mqtt: update failed:', error);
    });

    it('should tell a failed update when init fails on the way', async () => {
      // PREPARE
      const error = new Error('docker fail');
      zigbee2mqttManager.installMqttContainer = sinon.stub().rejects(error);
      // EXECUTE
      await expect(zigbee2mqttManager.init()).to.be.rejectedWith(error);
      // ASSERT
      assert.calledOnceWithExactly(zigbee2mqttManager.finishInstallation, error);
      assert.notCalled(zigbee2mqttManager.waitForZigbee2mqtt);
    });

    it('should postpone the update and keep the running containers when the new images are not downloaded', async () => {
      // PREPARE
      const error = new Error('docker fail pull');
      zigbee2mqttManager.pullMissingImages = sinon.stub().rejects(error);
      zigbee2mqttManager.installMqttContainer = sinon.stub().callsFake(async () => {
        zigbee2mqttManager.mqttRunning = true;
      });
      zigbee2mqttManager.backupScheduledJob = {};
      // EXECUTE
      await zigbee2mqttManager.init();
      // ASSERT
      assert.calledOnceWithExactly(zigbee2mqttManager.finishInstallation, error);
      // Nothing replaced: tried again on the next start, with the old version still stored
      assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
      assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
      assert.calledOnce(zigbee2mqttManager.connect);
      assert.calledWithMatch(zigbee2mqttManager.saveConfiguration, { dockerZ2mVersion: '12' });
      assert.notCalled(zigbee2mqttManager.waitForZigbee2mqtt);
      assert.calledOnceWithExactly(
        logger.warn,
        'Zigbee2mqtt: new images not downloaded, the update is postponed to the next start:',
        error,
      );
    });

    it('should fail a first installation when the images are not downloaded', async () => {
      // PREPARE
      gladys.system.getContainers = fake.resolves([]);
      const error = new Error('docker fail pull');
      zigbee2mqttManager.pullMissingImages = sinon.stub().rejects(error);
      // EXECUTE
      await expect(zigbee2mqttManager.init()).to.be.rejectedWith(error);
      // ASSERT
      assert.notCalled(zigbee2mqttManager.checkForContainerUpdates);
      assert.notCalled(zigbee2mqttManager.finishInstallation);
    });

    it('should not tell an update failed when init fails without one', async () => {
      // PREPARE
      gladys.system.getContainers = fake.resolves([]);
      zigbee2mqttManager.installMqttContainer = sinon.stub().rejects(new Error('docker fail'));
      // EXECUTE
      await expect(zigbee2mqttManager.init()).to.be.rejectedWith('docker fail');
      // ASSERT
      assert.notCalled(zigbee2mqttManager.finishInstallation);
      assert.notCalled(logger.error);
    });

    it('should not open an update while an installation runs this init', async () => {
      // PREPARE
      zigbee2mqttManager.startInstallation('switch');
      // EXECUTE
      await zigbee2mqttManager.init(true);
      // ASSERT
      expect(zigbee2mqttManager.installation.kind).to.equal('switch');
      assert.notCalled(gladys.system.getContainers);
      assert.notCalled(zigbee2mqttManager.waitForZigbee2mqtt);
    });

    it('should not follow a first installation as an update', async () => {
      // PREPARE
      gladys.system.getContainers = fake.resolves([]);
      // EXECUTE
      await zigbee2mqttManager.init();
      // ASSERT
      expect(zigbee2mqttManager.installation.state).to.equal('idle');
      assert.calledOnce(zigbee2mqttManager.checkForContainerUpdates);
      assert.notCalled(zigbee2mqttManager.waitForZigbee2mqtt);
    });

    it('should not look for the containers when they are up to date', async () => {
      // PREPARE
      zigbee2mqttManager.getConfiguration.resolves({
        z2mDriverPath: '/dev/ttyUSB0',
        mqttPassword: 'mqttPassword',
        dockerMqttVersion: DEFAULT.DOCKER_MQTT_VERSION,
        dockerZ2mVersion: DEFAULT.DOCKER_Z2M_VERSION,
      });
      // EXECUTE
      await zigbee2mqttManager.init();
      // ASSERT
      expect(zigbee2mqttManager.installation.state).to.equal('idle');
      assert.notCalled(gladys.system.getContainers);
    });

    it('should download the new image before replacing the running container', async () => {
      // PREPARE
      // The download, the update and the creation of the container are done for real
      delete zigbee2mqttManager.pullMissingImages;
      delete zigbee2mqttManager.checkForContainerUpdates;
      delete zigbee2mqttManager.installZ2mContainer;
      zigbee2mqttManager.configureContainer = fake.resolves({ configChanged: false, adapterChanged: false });
      zigbee2mqttManager.restoreZ2mBackup = fake.resolves(null);
      zigbee2mqttManager.readZ2mContainerLogs = fake();
      let currentZ2mContainer = z2mContainer;
      let newImagePulled = false;
      Object.assign(gladys.system, {
        getContainers: fake(({ filters }) =>
          Promise.resolve(
            filters.name[0] === 'gladys-z2m-zigbee2mqtt' && currentZ2mContainer ? [currentZ2mContainer] : [],
          ),
        ),
        // Only the new Zigbee2mqtt image is missing
        imageExists: fake((image) => Promise.resolve(image !== 'koenkk/zigbee2mqtt:2.14.2' || newImagePulled)),
        pull: fake(async () => {
          newImagePulled = true;
          return [];
        }),
        removeContainer: fake(async () => {
          currentZ2mContainer = null;
        }),
        createContainer: fake(async () => {
          currentZ2mContainer = { ...z2mContainer, id: 'new-z2m', state: 'created' };
        }),
        getGladysBasePath: fake.resolves({ basePathOnHost: '/var/lib/gladysassistant', basePathOnContainer: '/tmp' }),
      });
      // EXECUTE
      await zigbee2mqttManager.init();
      // ASSERT
      // Zigbee2mqtt stays in service during the download
      assert.calledOnce(gladys.system.pull);
      assert.calledOnceWithExactly(gladys.system.removeContainer, 'old-z2m', { force: true });
      assert.calledOnce(gladys.system.createContainer);
      assert.callOrder(gladys.system.pull, gladys.system.removeContainer, gladys.system.createContainer);
      assert.calledOnceWithExactly(gladys.system.restartContainer, 'new-z2m');
      const pullPhase = zigbee2mqttManager.installation.phases.find(({ key }) => key === 'pull_z2m');
      expect(pullPhase).to.deep.equal({ key: 'pull_z2m', state: 'done', progress: 100 });
      expect(await finished).to.equal(null);
    });
  });
});
