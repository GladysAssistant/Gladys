const crypto = require('crypto');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { promises: fs } = require('fs');

const { assert, fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ConflictError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

const { installMqttContainer } = proxyquire('../../../../services/zigbee2mqtt/lib/installMqttContainer', {});
const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {
  './installMqttContainer': { installMqttContainer },
});

const container = {
  id: 'docker-test',
  name: '/gladys-z2m-mqtt',
  state: 'running',
  labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
};

const containerStopped = {
  id: 'docker-test',
  name: '/gladys-z2m-mqtt',
  state: 'stopped',
  labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const credentials = {
  mqttUrl: 'mqtt://localhost:1884',
  mqttUsername: 'gladys',
  mqttPassword: 'gladys-password',
  z2mMqttUsername: 'z2m',
  z2mMqttPassword: 'z2m-password',
};

// The password matches its hash read in the Mosquitto password file
const matchesMosquittoHash = (hashedPassword, password) => {
  const [, , iterations, salt, hash] = hashedPassword.split('$');
  const expectedHash = crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), Number(iterations), 64, 'sha512');
  return hash === expectedHash.toString('base64');
};

describe('zigbee2mqtt installMqttContainer', () => {
  const TEMP_GLADYS_FOLDER = process.env.TEMP_FOLDER || '../.tmp';
  const mosquittoPwdPath = `${TEMP_GLADYS_FOLDER}/zigbee2mqtt/mqtt/mosquitto.passwd`;
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
        imageExists: fake.resolves(false),
        // Unknown without df
        getDiskSpace: fake.resolves(null),
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
    // The broker answers
    zigbee2mqttManager.waitForBroker = fake.resolves(true);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should restart MQTT container', async function Test() {
    // PREPARE
    this.timeout(6000);
    const config = { ...credentials };
    // EXECUTE
    await zigbee2mqttManager.installMqttContainer(config);
    // ASSERT
    assert.calledOnceWithExactly(gladys.system.restartContainer, container.id);
    assert.calledOnceWithExactly(zigbee2mqttManager.waitForBroker, config);
    assert.callOrder(gladys.system.restartContainer, zigbee2mqttManager.waitForBroker);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
        mqttRunning: true,
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
    expect(zigbee2mqttManager.mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.mqttExist).to.equal(true);
  });

  it('should neither recreate a stopped broker nor rewrite its accounts', async () => {
    // PREPARE
    await fs.mkdir(`${TEMP_GLADYS_FOLDER}/zigbee2mqtt/mqtt`, { recursive: true });
    await fs.writeFile(mosquittoPwdPath, 'gladys:existing-hash\n', 'utf-8');
    // EXECUTE
    await zigbee2mqttManager.installMqttContainer({ ...credentials });
    // ASSERT
    assert.notCalled(gladys.system.pull);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.system.exec);
    expect(await fs.readFile(mosquittoPwdPath, 'utf-8')).to.equal('gladys:existing-hash\n');
  });

  it('should do nothing', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([container]);
    // EXECUTE
    await zigbee2mqttManager.installMqttContainer(config);
    // ASSERT
    assert.notCalled(gladys.system.restartContainer);
    assert.notCalled(zigbee2mqttManager.waitForBroker);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
        mqttRunning: true,
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
    assert.notCalled(zigbee2mqttManager.waitForBroker);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: true,
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
    expect(zigbee2mqttManager.mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.mqttExist).to.equal(false);
  });

  it('should install MQTT container', async function Test() {
    // PREPARE
    const config = { ...credentials };
    this.timeout(11000);
    const getContainersStub = sinon.stub();
    getContainersStub
      .onFirstCall()
      .resolves([])
      .onSecondCall()
      .resolves([container]);
    gladys.system.getContainers = getContainersStub;
    gladys.system.pull = fake.resolves(true);
    await fs.rm(mosquittoPwdPath, { force: true });
    let mosquittoPwdContentOnCreation;
    gladys.system.createContainer = fake(async () => {
      mosquittoPwdContentOnCreation = await fs.readFile(mosquittoPwdPath, 'utf-8');
      return { id: container.id };
    });

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
    assert.calledOnce(gladys.system.createContainer);
    // Created stopped, started once, already configured
    assert.calledOnceWithExactly(gladys.system.restartContainer, container.id);
    assert.notCalled(gladys.system.exec);
    assert.calledOnceWithExactly(zigbee2mqttManager.waitForBroker, config);
    assert.callOrder(gladys.system.createContainer, gladys.system.restartContainer, zigbee2mqttManager.waitForBroker);
    expect(zigbee2mqttManager.mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.mqttExist).to.equal(true);
    const mosquittoConfPath = `${TEMP_GLADYS_FOLDER}/zigbee2mqtt/mqtt/mosquitto.conf`;
    const mosquittoConfContent = await fs.readFile(mosquittoConfPath, 'utf-8');
    expect(mosquittoConfContent).to.contain('listener 1884');
    expect(mosquittoConfContent).to.contain('allow_anonymous false');
    expect(mosquittoConfContent).to.contain('password_file /mosquitto/config/mosquitto.passwd');
    expect(mosquittoConfContent).to.contain('persistence true');
    expect(mosquittoConfContent).to.contain('persistence_location /mosquitto/config/');
    // Both accounts are in the password file before the container is created
    const [z2mAccount, gladysAccount, ...rest] = mosquittoPwdContentOnCreation.split('\n');
    expect(rest).to.deep.equal(['']);
    const [z2mUsername, z2mHashedPassword] = z2mAccount.split(':');
    expect(z2mUsername).to.equal('z2m');
    expect(matchesMosquittoHash(z2mHashedPassword, 'z2m-password')).to.equal(true);
    const [gladysUsername, gladysHashedPassword] = gladysAccount.split(':');
    expect(gladysUsername).to.equal('gladys');
    expect(matchesMosquittoHash(gladysHashedPassword, 'gladys-password')).to.equal(true);
  });

  it('should log how long each step of the installation takes', async () => {
    // PREPARE
    const infoStub = sinon.stub(logger, 'info');
    gladys.system.getContainers = sinon
      .stub()
      .onFirstCall()
      .resolves([])
      .onSecondCall()
      .resolves([container]);
    // EXECUTE
    try {
      await zigbee2mqttManager.installMqttContainer({ ...credentials });
    } finally {
      infoStub.restore();
    }
    // ASSERT
    assert.calledWith(infoStub, sinon.match(/^eclipse-mosquitto:.+ image pulled in \d+\.\d s$/));
    assert.calledWith(infoStub, sinon.match(/^MQTT broker container created in \d+\.\d s$/));
    assert.calledWith(infoStub, sinon.match(/^MQTT broker container started in \d+\.\d s$/));
  });

  it('should log how long a stopped broker takes to start', async () => {
    // PREPARE
    const infoStub = sinon.stub(logger, 'info');
    // EXECUTE
    try {
      await zigbee2mqttManager.installMqttContainer({});
    } finally {
      infoStub.restore();
    }
    // ASSERT
    assert.calledWith(infoStub, sinon.match(/^MQTT broker container started in \d+\.\d s$/));
  });

  describe('during an installation', () => {
    const phase = (key) =>
      zigbee2mqttManager.installation.phases.find((installationPhase) => installationPhase.key === key);

    beforeEach(() => {
      zigbee2mqttManager.emitInstallProgress = fake();
      zigbee2mqttManager.startInstallation('install');
    });

    it('should report the progress of the download, then start the broker', async () => {
      // PREPARE
      gladys.system.getContainers = sinon
        .stub()
        .onFirstCall()
        .resolves([])
        .onSecondCall()
        .resolves([container]);
      let pullPhaseDuringPull;
      gladys.system.pull = fake(async (image, onProgress) => {
        onProgress({ status: 'Pulling from library/eclipse-mosquitto', id: '2.0.15' });
        onProgress({ status: 'Downloading', progressDetail: { current: 50, total: 100 }, id: 'aaa' });
        pullPhaseDuringPull = { ...phase('pull_mqtt') };
        return [];
      });
      // EXECUTE
      await zigbee2mqttManager.installMqttContainer({ ...credentials });
      // ASSERT
      expect(pullPhaseDuringPull).to.deep.equal({ key: 'pull_mqtt', state: 'running', progress: 25 });
      expect(phase('pull_mqtt')).to.deep.equal({ key: 'pull_mqtt', state: 'done', progress: 100 });
      expect(phase('start_mqtt')).to.deep.equal({ key: 'start_mqtt', state: 'done', progress: 100 });
    });

    it('should leave the broker starting when its configuration fails', async () => {
      // PREPARE
      gladys.system.getContainers = fake.resolves([]);
      gladys.system.createContainer = fake.rejects(new Error('docker fail create'));
      // EXECUTE
      await expect(zigbee2mqttManager.installMqttContainer({ ...credentials })).to.be.rejectedWith(
        'docker fail create',
      );
      // ASSERT
      // Marked as failed by finishInstallation
      expect(phase('pull_mqtt').state).to.equal('done');
      expect(phase('start_mqtt').state).to.equal('running');
    });

    it('should not download an image already present, and create the broker', async () => {
      // PREPARE
      gladys.system.getContainers = sinon
        .stub()
        .onFirstCall()
        .resolves([])
        .onSecondCall()
        .resolves([container]);
      gladys.system.imageExists = fake.resolves(true);
      // EXECUTE
      await zigbee2mqttManager.installMqttContainer({ ...credentials });
      // ASSERT
      // Faster, and works offline: Docker would ask the registry
      assert.calledOnceWithExactly(gladys.system.imageExists, 'eclipse-mosquitto:2.0.15');
      assert.notCalled(gladys.system.pull);
      assert.calledOnce(gladys.system.createContainer);
      expect(phase('pull_mqtt')).to.deep.equal({ key: 'pull_mqtt', state: 'skipped', progress: 100 });
      expect(phase('start_mqtt')).to.deep.equal({ key: 'start_mqtt', state: 'done', progress: 100 });
    });

    it('should keep the download done by init before', async () => {
      // PREPARE
      gladys.system.getContainers = sinon
        .stub()
        .onFirstCall()
        .resolves([])
        .onSecondCall()
        .resolves([container]);
      zigbee2mqttManager.updateInstallationPhase('pull_mqtt', { state: 'done' });
      gladys.system.imageExists = fake.resolves(true);
      // EXECUTE
      await zigbee2mqttManager.installMqttContainer({ ...credentials });
      // ASSERT
      expect(phase('pull_mqtt')).to.deep.equal({ key: 'pull_mqtt', state: 'done', progress: 100 });
    });

    it('should skip the download, and start a stopped broker', async () => {
      // EXECUTE
      await zigbee2mqttManager.installMqttContainer({});
      // ASSERT
      expect(phase('pull_mqtt')).to.deep.equal({ key: 'pull_mqtt', state: 'skipped', progress: 100 });
      expect(phase('start_mqtt')).to.deep.equal({ key: 'start_mqtt', state: 'done', progress: 100 });
    });

    it('should skip both phases when the broker runs', async () => {
      // PREPARE
      gladys.system.getContainers = fake.resolves([container]);
      // EXECUTE
      await zigbee2mqttManager.installMqttContainer({});
      // ASSERT
      expect(phase('pull_mqtt').state).to.equal('skipped');
      expect(phase('start_mqtt').state).to.equal('skipped');
    });

    it('should fail when the broker it created does not answer, instead of showing it started', async () => {
      // PREPARE
      gladys.system.getContainers = sinon
        .stub()
        .onFirstCall()
        .resolves([])
        .onSecondCall()
        .resolves([container]);
      gladys.system.createContainer = fake.resolves({ id: container.id });
      zigbee2mqttManager.waitForBroker = fake.resolves(false);
      // EXECUTE
      const promise = zigbee2mqttManager.installMqttContainer({ ...credentials });
      // ASSERT
      const error = await promise.catch((e) => e);
      expect(error.message).to.equal('MQTT broker did not answer within 30.0 s');
      expect(zigbee2mqttManager.mqttRunning).to.equal(false);
      // The phase that fails, shown as such once the installation tells its failure
      expect(phase('start_mqtt').state).to.equal('running');
      zigbee2mqttManager.finishInstallation(error);
      expect(phase('start_mqtt').state).to.equal('failed');
      expect(zigbee2mqttManager.installation.error).to.deep.equal({
        code: null,
        message: 'MQTT broker did not answer within 30.0 s',
      });
    });
  });

  it('should fail when the stopped broker it starts for another coordinator does not answer', async () => {
    // PREPARE
    zigbee2mqttManager.emitInstallProgress = fake();
    zigbee2mqttManager.startInstallation('switch');
    zigbee2mqttManager.waitForBroker = fake.resolves(false);
    // EXECUTE
    const promise = zigbee2mqttManager.installMqttContainer({ ...credentials });
    // ASSERT
    await expect(promise).to.be.rejectedWith('MQTT broker did not answer within 30.0 s');
    expect(zigbee2mqttManager.installation.phases.find(({ key }) => key === 'start_mqtt').state).to.equal('running');
  });

  it('should go on without the answer of the broker during an update, as Gladys connects once it answers', async () => {
    // PREPARE
    zigbee2mqttManager.emitInstallProgress = fake();
    zigbee2mqttManager.startInstallation('update');
    zigbee2mqttManager.waitForBroker = fake.resolves(false);
    // EXECUTE
    await zigbee2mqttManager.installMqttContainer({ ...credentials });
    // ASSERT
    expect(zigbee2mqttManager.mqttRunning).to.equal(true);
    expect(zigbee2mqttManager.installation.phases.find(({ key }) => key === 'start_mqtt').state).to.equal('done');
  });

  it('should go on without the answer of the broker at the start of Gladys', async () => {
    // PREPARE
    zigbee2mqttManager.waitForBroker = fake.resolves(false);
    // EXECUTE
    await zigbee2mqttManager.installMqttContainer({ ...credentials });
    // ASSERT
    expect(zigbee2mqttManager.mqttRunning).to.equal(true);
  });

  it('should go on without the answer of the broker after a failed installation', async () => {
    // PREPARE
    zigbee2mqttManager.emitInstallProgress = fake();
    zigbee2mqttManager.startInstallation('install');
    zigbee2mqttManager.finishInstallation(new Error('docker fail pull'));
    zigbee2mqttManager.waitForBroker = fake.resolves(false);
    // EXECUTE
    await zigbee2mqttManager.installMqttContainer({ ...credentials });
    // ASSERT
    expect(zigbee2mqttManager.mqttRunning).to.equal(true);
  });

  it('should fail to configure MQTT container', async function Test() {
    // PREPARE
    this.timeout(11000);
    const config = { ...credentials };
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
    assert.calledOnce(gladys.system.createContainer);
    assert.calledOnce(gladys.system.restartContainer);
    assert.notCalled(zigbee2mqttManager.waitForBroker);
    expect(zigbee2mqttManager.mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.mqttExist).to.equal(true);
  });

  it('should not adopt a user container carrying our name', async () => {
    // PREPARE
    const config = {};
    gladys.system.getContainers = fake.resolves([{ id: 'user-container', name: '/gladys-z2m-mqtt', image: 'nginx' }]);
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'nginx:alpine' } });
    // EXECUTE
    let error;
    try {
      await zigbee2mqttManager.installMqttContainer(config);
    } catch (e) {
      error = e;
    }
    // ASSERT
    expect(error).to.be.instanceOf(ConflictError);
    assert.notCalled(gladys.system.pull);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.system.restartContainer);
    assert.notCalled(gladys.system.exec);
    expect(zigbee2mqttManager.mqttExist).to.equal(false);
    // the message is shown as is by the setup page, so the user reads which container to rename
    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: null, message: error.message });
    assert.calledOnce(gladys.event.emit);
  });
});
