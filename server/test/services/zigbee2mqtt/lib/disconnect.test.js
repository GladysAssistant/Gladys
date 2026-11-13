const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ConflictError } = require('../../../../utils/coreErrors');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

// Our own container, named after the requested filter
const ownContainer = (options) =>
  Promise.resolve([
    {
      id: 'docker-test',
      name: `/${options.filters.name[0]}`,
      labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
    },
  ]);

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const mqtt = {
  end: fake.resolves(true),
  removeAllListeners: fake.resolves(true),
};

describe('zigbee2mqtt disconnect', () => {
  // PREPARE
  let zigbee2MqttManager;
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
        getContainers: fake(ownContainer),
        inspectContainer: fake.resolves({ Config: { Image: 'nginx:alpine' } }),
        stopContainer: fake.resolves(true),
        removeContainer: fake.resolves(true),
      },
    };

    zigbee2MqttManager = new Zigbee2mqttManager(gladys, mqtt, serviceId);
    zigbee2MqttManager.dockerBased = true;
    zigbee2MqttManager.networkModeValid = true;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('mqtt not connected', async () => {
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledThrice(gladys.event.emit);
    assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        networkAdapterConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
        ezspFallback: false,
        mqttConnectionError: null,
        installation: { state: 'idle', kind: null, phases: [], progress: 0, error: null, durationMs: null },
        prefetch: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null },
      },
    });
    assert.calledTwice(gladys.system.stopContainer);
    assert.calledTwice(gladys.system.removeContainer);
    // With their anonymous volumes, left behind otherwise
    assert.alwaysCalledWithMatch(gladys.system.removeContainer, sinon.match.string, { v: true });
  });

  it('mqtt connected', async () => {
    // PREPARE
    zigbee2MqttManager.mqttClient = mqtt;
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledThrice(gladys.event.emit);
    assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        networkAdapterConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
        ezspFallback: false,
        mqttConnectionError: null,
        installation: { state: 'idle', kind: null, phases: [], progress: 0, error: null, durationMs: null },
        prefetch: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null },
      },
    });
    assert.calledTwice(gladys.system.stopContainer);
    assert.calledTwice(gladys.system.removeContainer);
    assert.calledOnce(mqtt.end);
    assert.calledOnce(mqtt.removeAllListeners);

    expect(zigbee2MqttManager.mqttClient).to.equal(null);
  });

  it('clear backup interval', async () => {
    // PREPARE
    const backupScheduledJob = {
      cancel: fake.returns(true),
    };
    zigbee2MqttManager.backupScheduledJob = backupScheduledJob;
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledOnce(backupScheduledJob.cancel);
    // Forgotten, so that the next init schedules it again
    expect(zigbee2MqttManager.backupScheduledJob).to.equal(null);
    assert.calledThrice(gladys.event.emit);
    assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        networkAdapterConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
        ezspFallback: false,
        mqttConnectionError: null,
        installation: { state: 'idle', kind: null, phases: [], progress: 0, error: null, durationMs: null },
        prefetch: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null },
      },
    });
  });

  it('should end a pending startup and forget the removed containers', async () => {
    // PREPARE
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const startingTimeout = fake();
    const healthCheckRetry = fake();
    zigbee2MqttManager.zigbee2mqttStarting = true;
    zigbee2MqttManager.startingTimer = setTimeout(startingTimeout, 1000);
    zigbee2MqttManager.healthCheckTimer = setTimeout(healthCheckRetry, 1000);
    zigbee2MqttManager.mqttExist = true;
    zigbee2MqttManager.zigbee2mqttExist = true;
    try {
      // EXECUTE
      await zigbee2MqttManager.disconnect();
      clock.tick(1000);
    } finally {
      clock.restore();
    }
    // ASSERT
    assert.notCalled(startingTimeout);
    assert.notCalled(healthCheckRetry);
    expect(zigbee2MqttManager.startingTimer).to.equal(null);
    expect(zigbee2MqttManager.healthCheckTimer).to.equal(null);
    expect(zigbee2MqttManager.zigbee2mqttStarting).to.equal(false);
    // Disabled, not "not responding": the banner of the discover page says that Zigbee2mqtt is not activated
    expect(zigbee2MqttManager.mqttExist).to.equal(false);
    expect(zigbee2MqttManager.zigbee2mqttExist).to.equal(false);
  });

  describe('with the installation followed by the setup page', () => {
    let clock;
    // The installations sent to the setup page
    const sentInstallations = () =>
      gladys.event.emit
        .getCalls()
        .filter(({ args }) => args[1].type === WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.INSTALL_PROGRESS)
        .map(({ args }) => args[1].payload.installation);

    beforeEach(() => {
      clock = sinon.useFakeTimers({ now: 1700000000000, toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
      clock.restore();
    });

    it('should forget the failure of the last installation, and send it at once', async () => {
      // PREPARE
      zigbee2MqttManager.startInstallation('install');
      zigbee2MqttManager.finishInstallation(new Error('docker fail pull'));
      gladys.event.emit.resetHistory();
      // EXECUTE
      await zigbee2MqttManager.disconnect();
      // ASSERT
      expect(zigbee2MqttManager.installation.state).to.equal('idle');
      expect(sentInstallations()).to.deep.equal([zigbee2MqttManager.installation]);
      // Sent at once, even within the interval since the failure was sent
      expect(zigbee2MqttManager.installProgressTimer).to.equal(null);
      expect(clock.countTimers()).to.equal(0);
    });

    it('should keep a running installation, which tells its own outcome', async () => {
      // PREPARE
      zigbee2MqttManager.startInstallation('install');
      const { installation } = zigbee2MqttManager;
      gladys.event.emit.resetHistory();
      // EXECUTE
      await zigbee2MqttManager.disconnect();
      // ASSERT
      expect(zigbee2MqttManager.installation).to.equal(installation);
      expect(sentInstallations()).to.deep.equal([]);
    });

    it('should send at once the progress left waiting, not after the integration is disabled', async () => {
      // PREPARE
      zigbee2MqttManager.emitInstallProgress();
      zigbee2MqttManager.prefetch.progress = 42;
      // Within the interval: left waiting
      zigbee2MqttManager.emitInstallProgress();
      gladys.event.emit.resetHistory();
      // EXECUTE
      await zigbee2MqttManager.disconnect();
      // ASSERT
      const progressCalls = gladys.event.emit
        .getCalls()
        .filter(({ args }) => args[1].type === WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.INSTALL_PROGRESS);
      expect(progressCalls.map(({ args }) => args[1].payload.prefetch.progress)).to.deep.equal([42]);
      expect(zigbee2MqttManager.installProgressTimer).to.equal(null);
      expect(clock.countTimers()).to.equal(0);
    });
  });

  it('no container -> nothing to stop', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([]);
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledTwice(gladys.system.getContainers);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    expect(zigbee2MqttManager.mqttRunning).to.equal(false);
    expect(zigbee2MqttManager.zigbee2mqttRunning).to.equal(false);
  });

  it('our names are taken by user containers -> they are left untouched', async () => {
    // PREPARE
    gladys.system.getContainers = fake((options) =>
      Promise.resolve([{ id: 'user-container', name: `/${options.filters.name[0]}`, image: 'nginx:alpine' }]),
    );
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledTwice(gladys.system.inspectContainer);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    expect(zigbee2MqttManager.mqttRunning).to.equal(false);
    expect(zigbee2MqttManager.zigbee2mqttRunning).to.equal(false);
  });

  it('should refuse a setup sent while it runs, whose installation would lose the containers removed meanwhile', async () => {
    // PREPARE
    let releaseDocker;
    const dockerReleased = new Promise((resolve) => {
      releaseDocker = resolve;
    });
    // The broker is being stopped, as when the disconnect route was sent from another tab
    gladys.system.stopContainer = fake(async () => {
      await dockerReleased;
      return true;
    });
    zigbee2MqttManager.getConfiguration = fake.resolves({});
    zigbee2MqttManager.runInstallation = fake.resolves(null);
    const disconnecting = zigbee2MqttManager.disconnect();
    // Counted from its first line: a route checked before calling it is refused at once
    expect(zigbee2MqttManager.runningOperations).to.equal(1);
    // EXECUTE
    const setup = zigbee2MqttManager.setup({ ZIGBEE2MQTT_DRIVER_PATH: 'usb0', ZIGBEE_DONGLE_NAME: 'dongle-name' });
    // ASSERT
    // Answered with a 409 by the error middleware
    await expect(setup).to.be.rejectedWith(
      ConflictError,
      'Zigbee2mqtt: cannot save the setup while the integration is busy',
    );
    expect(zigbee2MqttManager.installation.state).to.equal('idle');
    assert.notCalled(zigbee2MqttManager.runInstallation);
    releaseDocker();
    await disconnecting;
    // A setup is accepted again
    expect(zigbee2MqttManager.runningOperations).to.equal(0);
  });

  it('should stop counting itself when it fails', async () => {
    // PREPARE
    gladys.system.stopContainer = fake.rejects(new Error('Docker is not answering'));
    // EXECUTE
    await expect(zigbee2MqttManager.disconnect()).to.be.rejectedWith('Docker is not answering');
    // ASSERT
    // A setup is accepted again
    expect(zigbee2MqttManager.runningOperations).to.equal(0);
  });
});
