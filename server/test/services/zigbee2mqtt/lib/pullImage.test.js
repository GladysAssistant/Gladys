const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const logger = require('../../../../utils/logger');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const Z2M_IMAGE = 'koenkk/zigbee2mqtt:2.14.2';
const MQTT_IMAGE = 'eclipse-mosquitto:2.0.15';

describe('zigbee2mqtt pullImage', () => {
  let zigbee2mqttManager;
  let gladys;
  // Each pull waits for its end, decided by the test
  let pulls;

  const phase = (key) =>
    zigbee2mqttManager.installation.phases.find((installationPhase) => installationPhase.key === key);

  beforeEach(() => {
    pulls = [];
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      system: {
        imageExists: fake.resolves(false),
        pull: fake(
          (image, onProgress) =>
            new Promise((resolve, reject) => {
              pulls.push({ image, onProgress, resolve, reject });
            }),
        ),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.emitInstallProgress = fake();
  });

  afterEach(() => {
    sinon.restore();
  });

  // Until the pull is asked to Docker
  const waitForPull = async (count = 1) => {
    while (pulls.length < count) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
    }
  };

  it('should not download an image already present', async () => {
    // PREPARE
    const infoStub = sinon.stub(logger, 'info');
    gladys.system.imageExists = fake.resolves(true);
    zigbee2mqttManager.startInstallation('install');
    // EXECUTE
    await zigbee2mqttManager.pullImage(MQTT_IMAGE);
    // ASSERT
    // Docker would ask the registry: slower, and fails offline
    assert.calledOnceWithExactly(gladys.system.imageExists, MQTT_IMAGE);
    assert.notCalled(gladys.system.pull);
    assert.calledWithExactly(infoStub, 'eclipse-mosquitto:2.0.15 image already present');
    // Skipped by the installation of the container
    expect(phase('pull_mqtt').state).to.equal('pending');
  });

  it('should download a missing image, and log how long it takes', async () => {
    // PREPARE
    const infoStub = sinon.stub(logger, 'info');
    // EXECUTE
    const promise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
    await waitForPull();
    pulls[0].resolve([]);
    await promise;
    // ASSERT
    assert.calledOnce(gladys.system.pull);
    assert.calledWith(gladys.system.pull, Z2M_IMAGE);
    assert.calledWith(infoStub, sinon.match(/^koenkk\/zigbee2mqtt:.+ image pulled in \d+\.\d s$/));
  });

  it('should download an image once at a time, for the installation and the prefetch', async () => {
    // EXECUTE
    const firstPromise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
    const secondPromise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
    await waitForPull();
    pulls[0].resolve([]);
    await Promise.all([firstPromise, secondPromise]);
    // ASSERT
    assert.calledOnce(gladys.system.imageExists);
    assert.calledOnce(gladys.system.pull);
    // Once over, the next call checks again whether the image is there
    expect(zigbee2mqttManager.imagePulls).to.deep.equal({});
    gladys.system.imageExists = fake.resolves(true);
    await zigbee2mqttManager.pullImage(Z2M_IMAGE);
    assert.calledOnce(gladys.system.imageExists);
    assert.calledOnce(gladys.system.pull);
  });

  it('should download different images in parallel', async () => {
    // EXECUTE
    const promise = Promise.all([zigbee2mqttManager.pullImage(Z2M_IMAGE), zigbee2mqttManager.pullImage(MQTT_IMAGE)]);
    await waitForPull(2);
    pulls.forEach((pull) => pull.resolve([]));
    await promise;
    // ASSERT
    expect(pulls.map(({ image }) => image)).to.deep.equal([Z2M_IMAGE, MQTT_IMAGE]);
  });

  it('should fail for each caller, then try again', async () => {
    // PREPARE
    const error = new Error('docker fail pull');
    // EXECUTE
    const firstPromise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
    const secondPromise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
    await waitForPull();
    pulls[0].reject(error);
    // ASSERT
    await expect(firstPromise).to.be.rejectedWith(error);
    await expect(secondPromise).to.be.rejectedWith(error);
    const retryPromise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
    await waitForPull(2);
    pulls[1].resolve([]);
    await retryPromise;
    assert.calledTwice(gladys.system.pull);
  });

  it('should report the progress of the download to the installation and to the prefetch', async () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    zigbee2mqttManager.updatePrefetchProgress = fake();
    // EXECUTE
    const promise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
    await waitForPull();
    // ASSERT
    expect(phase('pull_mqtt')).to.deep.equal({ key: 'pull_mqtt', state: 'running', progress: 0 });
    zigbee2mqttManager.emitInstallProgress.resetHistory();
    pulls[0].onProgress({ status: 'Downloading', progressDetail: { current: 50, total: 100 }, id: 'aaa' });
    expect(phase('pull_mqtt')).to.deep.equal({ key: 'pull_mqtt', state: 'running', progress: 25 });
    expect(phase('pull_z2m').state).to.equal('pending');
    assert.calledOnceWithExactly(zigbee2mqttManager.updatePrefetchProgress, MQTT_IMAGE, 25);
    assert.called(zigbee2mqttManager.emitInstallProgress);
    sinon.assert.callOrder(zigbee2mqttManager.updatePrefetchProgress, zigbee2mqttManager.emitInstallProgress);
    pulls[0].resolve([]);
    await promise;
    // Done as soon as downloaded: init downloads the images before installing the containers
    expect(phase('pull_mqtt')).to.deep.equal({ key: 'pull_mqtt', state: 'done', progress: 100 });
  });

  it('should follow a download already running in an installation started meanwhile', async () => {
    // PREPARE
    // Started by the prefetch, before the setup
    const promise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
    await waitForPull();
    pulls[0].onProgress({ status: 'Downloading', progressDetail: { current: 20, total: 100 }, id: 'aaa' });
    // EXECUTE
    zigbee2mqttManager.startInstallation('install');
    const installationPromise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
    pulls[0].onProgress({ status: 'Downloading', progressDetail: { current: 60, total: 100 }, id: 'aaa' });
    // ASSERT
    expect(phase('pull_z2m')).to.deep.equal({ key: 'pull_z2m', state: 'running', progress: 30 });
    pulls[0].resolve([]);
    await Promise.all([installationPromise, promise]);
    expect(phase('pull_z2m')).to.deep.equal({ key: 'pull_z2m', state: 'done', progress: 100 });
    assert.calledOnce(gladys.system.pull);
  });
});
