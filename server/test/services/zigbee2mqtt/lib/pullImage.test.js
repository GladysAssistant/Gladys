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
        // Unknown without df
        getDiskSpace: fake.resolves(null),
        listImages: fake.resolves([]),
        removeImage: fake.resolves(true),
        pull: fake(
          (image, onProgress, { abortSignal }) =>
            new Promise((resolve, reject) => {
              pulls.push({ image, onProgress, abortSignal, resolve, reject });
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

  it('should tell that the download failed, not the other one running alongside it', async () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    const promise = Promise.allSettled([
      zigbee2mqttManager.pullImage(Z2M_IMAGE),
      zigbee2mqttManager.pullImage(MQTT_IMAGE),
    ]);
    await waitForPull(2);
    // EXECUTE
    pulls[1].reject(new Error('docker fail pull'));
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    // ASSERT
    expect(phase('pull_mqtt').state).to.equal('failed');
    expect(phase('pull_z2m').state).to.equal('running');
    pulls[0].resolve([]);
    await promise;
  });

  describe('with the free disk space known', () => {
    const diskSpace = (available) => ({ available, size: 32000000000, used: 0, capacity: 0, mountpoint: '/' });

    it('should not download an image that does not fit with the margin left free', async () => {
      // PREPARE
      sinon.stub(logger, 'info');
      // The Zigbee2mqtt image (214 MB) and the margin (500 MB), but one byte
      gladys.system.getDiskSpace = fake.resolves(diskSpace(713999999));
      zigbee2mqttManager.startInstallation('install');
      // EXECUTE
      const error = await zigbee2mqttManager.pullImage(Z2M_IMAGE).catch((e) => e);
      // ASSERT
      expect(error.message).to.equal(
        'Not enough disk space to download koenkk/zigbee2mqtt:2.14.2: 714000000 bytes needed, 713999999 bytes free',
      );
      assert.notCalled(gladys.system.pull);
      expect(phase('pull_z2m').state).to.equal('failed');
      // Shown by the setup page like the failure of the prefetch
      zigbee2mqttManager.finishInstallation(error);
      expect(zigbee2mqttManager.installation.error).to.deep.equal({ code: 'NOT_ENOUGH_DISK_SPACE', message: null });
    });

    it('should remove the other versions no container uses when the image does not fit, then download it', async () => {
      // PREPARE
      const infoStub = sinon.stub(logger, 'info');
      // Fits once the image of an earlier version is removed
      gladys.system.getDiskSpace = sinon
        .stub()
        .onFirstCall()
        .resolves(diskSpace(600000000))
        .onSecondCall()
        .resolves(diskSpace(800000000));
      gladys.system.listImages = fake.resolves([
        { id: 'sha256:old', tags: ['koenkk/zigbee2mqtt:1.42.0', 'koenkk/zigbee2mqtt:latest'] },
        { id: 'sha256:in-place', tags: ['koenkk/zigbee2mqtt:2.6.0'] },
        // Spelled with the Docker Hub prefix by a runtime, like the Docker API of Podman
        { id: 'sha256:older', tags: ['docker.io/koenkk/zigbee2mqtt:1.30.0'] },
        // Not of this repository, whatever Docker matches
        { id: 'sha256:other', tags: ['koenkk/zigbee2mqtt-proxy:1.0.0', 'docker.io/someone/zigbee2mqtt:1.0.0'] },
      ]);
      // Docker declines to remove the image of the container in place
      gladys.system.removeImage = fake((tag) => Promise.resolve(tag !== 'koenkk/zigbee2mqtt:2.6.0'));
      // EXECUTE
      const promise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
      await waitForPull();
      pulls[0].resolve([]);
      await promise;
      // ASSERT
      assert.calledOnceWithExactly(gladys.system.listImages, { filters: { reference: ['koenkk/zigbee2mqtt'] } });
      expect(gladys.system.removeImage.args.map(([tag]) => tag)).to.deep.equal([
        'koenkk/zigbee2mqtt:1.42.0',
        'koenkk/zigbee2mqtt:latest',
        'koenkk/zigbee2mqtt:2.6.0',
        'docker.io/koenkk/zigbee2mqtt:1.30.0',
      ]);
      assert.calledWithExactly(
        infoStub,
        'Zigbee2mqtt: image koenkk/zigbee2mqtt:1.42.0 removed to download koenkk/zigbee2mqtt:2.14.2',
      );
      assert.calledWithExactly(
        infoStub,
        'Zigbee2mqtt: image docker.io/koenkk/zigbee2mqtt:1.30.0 removed to download koenkk/zigbee2mqtt:2.14.2',
      );
      assert.neverCalledWith(
        infoStub,
        'Zigbee2mqtt: image koenkk/zigbee2mqtt:2.6.0 removed to download koenkk/zigbee2mqtt:2.14.2',
      );
      assert.calledTwice(gladys.system.getDiskSpace);
      assert.callOrder(gladys.system.removeImage, gladys.system.pull);
      assert.calledOnce(gladys.system.pull);
    });

    it('should remove the other versions of an official image spelled with the Docker Hub library prefix', async () => {
      // PREPARE
      sinon.stub(logger, 'info');
      // The MQTT broker image (22 MB) and the margin (500 MB) fit once the other version is removed
      gladys.system.getDiskSpace = sinon
        .stub()
        .onFirstCall()
        .resolves(diskSpace(500000000))
        .onSecondCall()
        .resolves(diskSpace(800000000));
      gladys.system.listImages = fake.resolves([
        { id: 'sha256:old', tags: ['docker.io/library/eclipse-mosquitto:2.0.14'] },
      ]);
      // EXECUTE
      const promise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
      await waitForPull();
      pulls[0].resolve([]);
      await promise;
      // ASSERT
      assert.calledOnceWithExactly(gladys.system.listImages, { filters: { reference: ['eclipse-mosquitto'] } });
      assert.calledOnceWithExactly(gladys.system.removeImage, 'docker.io/library/eclipse-mosquitto:2.0.14');
      assert.calledOnce(gladys.system.pull);
    });

    it('should not download an image that still does not fit once the other versions are removed', async () => {
      // PREPARE
      gladys.system.getDiskSpace = fake.resolves(diskSpace(600000000));
      gladys.system.listImages = fake.resolves([{ id: 'sha256:in-place', tags: ['koenkk/zigbee2mqtt:2.6.0'] }]);
      gladys.system.removeImage = fake.resolves(false);
      zigbee2mqttManager.startInstallation('install');
      // EXECUTE
      const error = await zigbee2mqttManager.pullImage(Z2M_IMAGE).catch((e) => e);
      // ASSERT
      expect(error.installationError).to.deep.equal({ code: 'NOT_ENOUGH_DISK_SPACE', message: null });
      assert.calledTwice(gladys.system.getDiskSpace);
      assert.notCalled(gladys.system.pull);
      expect(phase('pull_z2m').state).to.equal('failed');
    });

    it('should tell the lack of disk space when the other versions cannot be listed', async () => {
      // PREPARE
      const warnStub = sinon.stub(logger, 'warn');
      const listError = new Error('docker fail list');
      gladys.system.getDiskSpace = fake.resolves(diskSpace(600000000));
      gladys.system.listImages = fake.rejects(listError);
      // EXECUTE
      const error = await zigbee2mqttManager.pullImage(Z2M_IMAGE).catch((e) => e);
      // ASSERT
      expect(error.installationError).to.deep.equal({ code: 'NOT_ENOUGH_DISK_SPACE', message: null });
      assert.calledWithExactly(warnStub, 'Zigbee2mqtt: other versions of koenkk/zigbee2mqtt not removed:', listError);
      assert.notCalled(gladys.system.removeImage);
      assert.notCalled(gladys.system.pull);
    });

    it('should not remove any image when the image fits', async () => {
      // PREPARE
      gladys.system.getDiskSpace = fake.resolves(diskSpace(714000000));
      // EXECUTE
      const promise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
      await waitForPull();
      pulls[0].resolve([]);
      await promise;
      // ASSERT
      assert.notCalled(gladys.system.listImages);
      assert.notCalled(gladys.system.removeImage);
      assert.calledOnce(gladys.system.getDiskSpace);
    });

    it('should download an image that fits with the margin left free', async () => {
      // PREPARE
      gladys.system.getDiskSpace = fake.resolves(diskSpace(522400000));
      // EXECUTE
      const promise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
      await waitForPull();
      pulls[0].resolve([]);
      await promise;
      // ASSERT
      assert.calledOnce(gladys.system.pull);
    });

    it('should not check the free disk space for an image already present', async () => {
      // PREPARE
      gladys.system.imageExists = fake.resolves(true);
      gladys.system.getDiskSpace = fake.resolves(diskSpace(0));
      // EXECUTE
      await zigbee2mqttManager.pullImage(MQTT_IMAGE);
      // ASSERT
      assert.notCalled(gladys.system.getDiskSpace);
    });
  });

  it('should tell the lack of disk space when the disk fills up during the download', async () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    const promise = zigbee2mqttManager.pullImage(Z2M_IMAGE).catch((e) => e);
    await waitForPull();
    // EXECUTE
    pulls[0].reject(new Error('failed to register layer: write layer.tar: no space left on device'));
    const error = await promise;
    // ASSERT
    expect(phase('pull_z2m').state).to.equal('failed');
    zigbee2mqttManager.finishInstallation(error);
    expect(zigbee2mqttManager.installation.error).to.deep.equal({ code: 'NOT_ENOUGH_DISK_SPACE', message: null });
  });

  it('should keep the raw message of another failed download', async () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    const promise = zigbee2mqttManager.pullImage(Z2M_IMAGE).catch((e) => e);
    await waitForPull();
    // EXECUTE
    pulls[0].reject(new Error('getaddrinfo EAI_AGAIN registry-1.docker.io'));
    const error = await promise;
    // ASSERT
    zigbee2mqttManager.finishInstallation(error);
    expect(zigbee2mqttManager.installation.error).to.deep.equal({
      code: null,
      message: 'getaddrinfo EAI_AGAIN registry-1.docker.io',
    });
  });

  it('should download an image when the free disk space is unknown', async () => {
    // EXECUTE
    const promise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
    await waitForPull();
    pulls[0].resolve([]);
    await promise;
    // ASSERT
    assert.calledOnce(gladys.system.getDiskSpace);
    assert.calledOnce(gladys.system.pull);
  });

  it('should fail at once, without downloading again, on a download failed in the last pullMissingImages', async () => {
    // PREPARE
    const error = new Error('Download of koenkk/zigbee2mqtt:2.14.2 stalled: no progress for 5 min');
    zigbee2mqttManager.imagePullFailures = { [Z2M_IMAGE]: error };
    zigbee2mqttManager.startInstallation('install');
    // EXECUTE
    const promise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
    // ASSERT
    await expect(promise).to.be.rejectedWith(error);
    assert.notCalled(gladys.system.imageExists);
    assert.notCalled(gladys.system.pull);
    // The container to create fails on this download
    expect(phase('pull_z2m').state).to.equal('failed');
    // The other image is downloaded
    const mqttPromise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
    await waitForPull();
    pulls[0].resolve([]);
    await mqttPromise;
    expect(pulls.map(({ image }) => image)).to.deep.equal([MQTT_IMAGE]);
  });

  describe('when the download makes no progress', () => {
    let clock;
    const progressEvent = { status: 'Downloading', progressDetail: { current: 50, total: 100 }, id: 'aaa' };

    beforeEach(() => {
      // Not setImmediate, which waitForPull uses. Restored by sinon.restore
      clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    it('should give up a download without any progress for 5 minutes, and release the image', async () => {
      // PREPARE
      zigbee2mqttManager.startInstallation('install');
      const promise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
      // Followed from now on, as it rejects while the clock ticks
      const rejection = expect(promise).to.be.rejectedWith(
        'Download of eclipse-mosquitto:2.0.15 stalled: no progress for 5 min',
      );
      await waitForPull();
      // EXECUTE
      await clock.tickAsync(2 * 60 * 1000);
      pulls[0].onProgress(progressEvent);
      // Counted from the last progress
      await clock.tickAsync(5 * 60 * 1000 - 1);
      expect(pulls[0].abortSignal.aborted).to.equal(false);
      await clock.tickAsync(1);
      // ASSERT
      // Even though the aborted pull never settles
      const error = await rejection;
      // Docker stops the download
      expect(pulls[0].abortSignal.aborted).to.equal(true);
      // Shown as the failure of the installation
      zigbee2mqttManager.finishInstallation(error);
      expect(zigbee2mqttManager.installation.error).to.deep.equal({
        code: null,
        message: 'Download of eclipse-mosquitto:2.0.15 stalled: no progress for 5 min',
      });
      // The next call downloads it again
      expect(zigbee2mqttManager.imagePulls).to.deep.equal({});
    });

    it('should give up a download that never starts', async () => {
      // PREPARE
      const promise = zigbee2mqttManager.pullImage(Z2M_IMAGE);
      const rejection = expect(promise).to.be.rejectedWith(
        'Download of koenkk/zigbee2mqtt:2.14.2 stalled: no progress for 5 min',
      );
      await waitForPull();
      // EXECUTE
      await clock.tickAsync(5 * 60 * 1000);
      // ASSERT
      await rejection;
    });

    it('should give up a download whose position Docker repeats without any progress', async () => {
      // PREPARE
      const promise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
      const rejection = expect(promise).to.be.rejectedWith(
        'Download of eclipse-mosquitto:2.0.15 stalled: no progress for 5 min',
      );
      await waitForPull();
      pulls[0].onProgress(progressEvent);
      // EXECUTE
      // Like the containerd image store of Docker, which repeats the position of each layer
      for (let minutes = 0; minutes < 4; minutes += 1) {
        // eslint-disable-next-line no-await-in-loop
        await clock.tickAsync(60 * 1000);
        pulls[0].onProgress(progressEvent);
      }
      await clock.tickAsync(60 * 1000);
      // ASSERT
      await rejection;
      expect(pulls[0].abortSignal.aborted).to.equal(true);
    });

    it('should keep waiting for a slow download that progresses, and stop watching it once over', async () => {
      // PREPARE
      const promise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
      await waitForPull();
      // EXECUTE
      for (let minutes = 0; minutes < 12; minutes += 4) {
        // eslint-disable-next-line no-await-in-loop
        await clock.tickAsync(4 * 60 * 1000);
        pulls[0].onProgress({ ...progressEvent, progressDetail: { current: minutes + 1, total: 100 } });
      }
      pulls[0].resolve([]);
      await promise;
      // ASSERT
      expect(pulls[0].abortSignal.aborted).to.equal(false);
      expect(clock.countTimers()).to.equal(0);
    });

    it('should stop watching a download that fails', async () => {
      // PREPARE
      const promise = zigbee2mqttManager.pullImage(MQTT_IMAGE);
      await waitForPull();
      // EXECUTE
      pulls[0].reject(new Error('docker fail pull'));
      // ASSERT
      await expect(promise).to.be.rejectedWith('docker fail pull');
      expect(pulls[0].abortSignal.aborted).to.equal(false);
      expect(clock.countTimers()).to.equal(0);
    });
  });
});
