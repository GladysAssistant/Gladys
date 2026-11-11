const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { IMAGE_SIZE_IN_BYTES } = require('../../../../services/zigbee2mqtt/lib/constants');
const { PlatformNotCompatible } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const z2mContainerDescriptor = require('../../../../services/zigbee2mqtt/docker/gladys-z2m-zigbee2mqtt-container.json');
const mqttContainerDescriptor = require('../../../../services/zigbee2mqtt/docker/gladys-z2m-mqtt-container.json');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const Z2M_IMAGE = 'koenkk/zigbee2mqtt:2.14.2';
const MQTT_IMAGE = 'eclipse-mosquitto:2.0.15';

// Until the background work is over
const flush = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('zigbee2mqtt startPrefetch', () => {
  let zigbee2mqttManager;
  let gladys;
  // Each pull waits for its end, decided by the test
  let pulls;

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
        getDiskSpace: fake.resolves({
          available: 1000000000,
          size: 32000000000,
          used: 0,
          capacity: 0,
          mountpoint: '/',
        }),
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
    sinon.stub(logger, 'error');
    sinon.stub(logger, 'warn');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should know the size of the image of each container', () => {
    // A descriptor that changes its image must measure it again
    expect(Object.keys(IMAGE_SIZE_IN_BYTES).sort()).to.deep.equal(
      [z2mContainerDescriptor.Image, mqttContainerDescriptor.Image].sort(),
    );
  });

  it('should download the missing images in parallel and in the background', async () => {
    // EXECUTE
    const prefetch = await zigbee2mqttManager.startPrefetch();
    // ASSERT
    expect(prefetch).to.deep.equal({
      state: 'running',
      progress: 0,
      freeBytes: 1000000000,
      neededBytes: 736400000,
      error: null,
    });
    expect(zigbee2mqttManager.status().prefetch).to.equal(prefetch);
    assert.calledOnce(zigbee2mqttManager.emitInstallProgress);
    await flush();
    // Both at the same time
    expect(pulls.map(({ image }) => image).sort()).to.deep.equal([MQTT_IMAGE, Z2M_IMAGE]);
    // Each image counts for its size
    pulls
      .find(({ image }) => image === Z2M_IMAGE)
      .onProgress({
        status: 'Downloading',
        progressDetail: { current: 100, total: 100 },
        id: 'aaa',
      });
    expect(prefetch.progress).to.equal(45);
    zigbee2mqttManager.emitInstallProgress.resetHistory();
    pulls.forEach((pull) => pull.resolve([]));
    await flush();
    expect(prefetch).to.deep.equal({
      state: 'done',
      progress: 100,
      freeBytes: 1000000000,
      neededBytes: 736400000,
      error: null,
    });
    // The setup page reads the outcome
    assert.calledOnce(zigbee2mqttManager.emitInstallProgress);
  });

  it('should download only the missing images', async () => {
    // PREPARE
    gladys.system.imageExists = fake((image) => Promise.resolve(image === MQTT_IMAGE));
    // EXECUTE
    const prefetch = await zigbee2mqttManager.startPrefetch();
    await flush();
    // ASSERT
    expect(prefetch.neededBytes).to.equal(714000000);
    expect(pulls.map(({ image }) => image)).to.deep.equal([Z2M_IMAGE]);
    // The progress is the one of this image only
    pulls[0].onProgress({ status: 'Downloading', progressDetail: { current: 100, total: 100 }, id: 'aaa' });
    expect(prefetch.progress).to.equal(50);
    pulls[0].resolve([]);
    await flush();
    expect(prefetch.state).to.equal('done');
  });

  it('should be done at once when no image is missing', async () => {
    // PREPARE
    gladys.system.imageExists = fake.resolves(true);
    // EXECUTE
    const prefetch = await zigbee2mqttManager.startPrefetch();
    // ASSERT
    expect(prefetch).to.deep.equal({
      state: 'done',
      progress: 100,
      freeBytes: 1000000000,
      neededBytes: 0,
      error: null,
    });
    assert.notCalled(gladys.system.pull);
    assert.calledOnce(zigbee2mqttManager.emitInstallProgress);
  });

  it('should download nothing when the images do not fit in the free disk space', async () => {
    // PREPARE
    gladys.system.getDiskSpace = fake.resolves({
      available: 200000000,
      size: 0,
      used: 0,
      capacity: 0,
      mountpoint: '/',
    });
    // EXECUTE
    const prefetch = await zigbee2mqttManager.startPrefetch();
    await flush();
    // ASSERT
    expect(prefetch).to.deep.equal({
      state: 'failed',
      progress: 0,
      freeBytes: 200000000,
      neededBytes: 736400000,
      error: { code: 'NOT_ENOUGH_DISK_SPACE', message: null },
    });
    assert.notCalled(gladys.system.pull);
    assert.calledOnce(zigbee2mqttManager.emitInstallProgress);
  });

  it('should keep a margin free on the disk on top of the images', async () => {
    // PREPARE
    // Enough for the images alone (236.4 MB), not with the margin left for the databases of Gladys
    gladys.system.getDiskSpace = fake.resolves({
      available: 400000000,
      size: 0,
      used: 0,
      capacity: 0,
      mountpoint: '/',
    });
    // EXECUTE
    const prefetch = await zigbee2mqttManager.startPrefetch();
    await flush();
    // ASSERT
    expect(prefetch.state).to.equal('failed');
    expect(prefetch.error).to.deep.equal({ code: 'NOT_ENOUGH_DISK_SPACE', message: null });
    assert.notCalled(gladys.system.pull);
  });

  it('should download the images when the free disk space is unknown', async () => {
    // PREPARE
    // Without df
    gladys.system.getDiskSpace = fake.resolves(null);
    // EXECUTE
    const prefetch = await zigbee2mqttManager.startPrefetch();
    await flush();
    // ASSERT
    expect(prefetch.state).to.equal('running');
    expect(prefetch.freeBytes).to.equal(null);
    expect(pulls).to.have.lengthOf(2);
  });

  it('should not start again a running prefetch', async () => {
    // EXECUTE
    // The setup page opened twice
    const [firstPrefetch, secondPrefetch] = await Promise.all([
      zigbee2mqttManager.startPrefetch(),
      zigbee2mqttManager.startPrefetch(),
    ]);
    await flush();
    // ASSERT
    expect(secondPrefetch).to.equal(firstPrefetch);
    // Once by the prefetch, then before each of its two downloads (see pullImage)
    assert.calledThrice(gladys.system.getDiskSpace);
    expect(pulls).to.have.lengthOf(2);
  });

  it('should not start again a done prefetch', async () => {
    // PREPARE
    gladys.system.imageExists = fake.resolves(true);
    const firstPrefetch = await zigbee2mqttManager.startPrefetch();
    // EXECUTE
    const secondPrefetch = await zigbee2mqttManager.startPrefetch();
    // ASSERT
    expect(secondPrefetch).to.equal(firstPrefetch);
    assert.calledOnce(gladys.system.getDiskSpace);
  });

  it('should tell why a download failed, and start again once asked', async () => {
    // PREPARE
    const error = new Error('docker fail pull');
    const prefetch = await zigbee2mqttManager.startPrefetch();
    await flush();
    // EXECUTE
    pulls[0].reject(error);
    await flush();
    // ASSERT
    expect(prefetch.state).to.equal('failed');
    expect(prefetch.error).to.deep.equal({ code: null, message: 'docker fail pull' });
    sinon.assert.calledWith(
      logger.error,
      'Zigbee2mqtt: failed to download the images ahead of the installation:',
      error,
    );
    // EXECUTE
    const newPrefetch = await zigbee2mqttManager.startPrefetch();
    // ASSERT
    expect(newPrefetch).to.not.equal(prefetch);
    expect(newPrefetch.state).to.equal('running');
    expect(newPrefetch.error).to.equal(null);
  });

  it('should tell the code of a system that does not run Docker', async () => {
    // PREPARE
    gladys.system.imageExists = fake.rejects(new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER'));
    // EXECUTE
    const prefetch = await zigbee2mqttManager.startPrefetch();
    // ASSERT
    expect(prefetch.state).to.equal('failed');
    expect(prefetch.error).to.deep.equal({ code: 'SYSTEM_NOT_RUNNING_DOCKER', message: null });
    assert.notCalled(gladys.system.pull);
    assert.calledOnce(zigbee2mqttManager.emitInstallProgress);
  });
});
