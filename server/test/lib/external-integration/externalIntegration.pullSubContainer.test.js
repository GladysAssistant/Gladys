const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const db = require('../../../models');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');
const { SUB_CONTAINER_DESIRED_VARIABLE } = require('../../../lib/external-integration/constants');
const {
  trackLayer,
  summarizePullProgress,
} = require('../../../lib/external-integration/externalIntegration.pullSubContainer');

// store install: no local fallback when the pull fails (ensureImage)
const seedFrigateService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST, store_slug: 'john/gladys-frigate', ...overrides });

/**
 * @description A system.pull whose download the test drives: progress events,
 * resolution, rejection. Like Docker, an abort rejects the download by
 * default; `onAbort: 'resolve'` simulates the last bytes arriving with it.
 * @param {object} [options] - Options.
 * @param {string} [options.onAbort] - 'reject' (default) or 'resolve'.
 * @returns {object} The pull fake and its controls.
 * @example
 * const download = buildControlledPull();
 */
function buildControlledPull({ onAbort = 'reject' } = {}) {
  const download = {};
  download.pull = sinon.stub().callsFake((image, onProgress, { abortSignal }) => {
    download.onProgress = onProgress;
    download.abortSignal = abortSignal;
    return new Promise((resolve, reject) => {
      download.resolve = resolve;
      download.reject = reject;
      abortSignal.addEventListener('abort', () => {
        if (onAbort === 'resolve') {
          resolve([]);
        } else {
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        }
      });
    });
  });
  return download;
}

/**
 * @description A Docker daemon reduced to the containers it holds, whose
 * restart (the start of startSubContainer) the test releases: what is left
 * once the concurrent gestures are over is what the assertions read.
 * @returns {object} The system overrides and their controls.
 * @example
 * const docker = buildControlledDocker();
 */
function buildControlledDocker() {
  const docker = { containers: [], restartCalled: null, restartSettle: null };
  let created = 0;
  docker.restartCalled = new Promise((resolveCalled) => {
    docker.system = {
      createContainer: sinon.stub().callsFake(async () => {
        created += 1;
        const container = { id: `mqtt-${created}` };
        docker.containers.push(container);
        return container;
      }),
      removeContainer: sinon.stub().callsFake(async (containerId) => {
        docker.containers = docker.containers.filter((container) => container.id !== containerId);
      }),
      getContainers: sinon.stub().callsFake(async () => docker.containers.map((container) => ({ ...container }))),
      restartContainer: sinon.stub().callsFake(
        () =>
          new Promise((resolve, reject) => {
            docker.restartSettle = { resolve, reject };
            resolveCalled();
          }),
      ),
    };
  });
  return docker;
}

/**
 * @description Let the pending callbacks run until a condition holds.
 * @param {Function} condition - Returns true once the state is reached.
 * @returns {Promise} Resolve when the condition holds.
 * @example
 * await waitUntil(() => system.restartContainer.callCount === 2);
 */
async function waitUntil(condition) {
  while (!condition()) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
}

const containerUpdates = (event) =>
  event.emit
    .getCalls()
    .filter(
      (call) =>
        call.args[0] === EVENTS.WEBSOCKET.SEND_ALL &&
        call.args[1].type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONTAINER_UPDATED,
    )
    .map((call) => call.args[1].payload);

describe('externalIntegration.pullSubContainer progress', () => {
  it('should only track the events describing a layer', () => {
    const layers = new Map();
    expect(trackLayer(layers, undefined)).to.equal(false);
    expect(trackLayer(layers, { status: 'Pulling from blakeblackshear/frigate', id: '0.18.0' })).to.equal(false);
    expect(trackLayer(layers, { status: 'Digest: sha256:abc' })).to.equal(false);
    expect(layers.size).to.equal(0);
    expect(summarizePullProgress(layers)).to.deep.equal({ progress: null, detail: '0/0 layers' });
  });

  it('should sum the bytes of the layers whose size is known', () => {
    const layers = new Map();
    trackLayer(layers, { id: 'a', status: 'Pulling fs layer' });
    trackLayer(layers, { id: 'b', status: 'Already exists' });
    // no size announced yet
    trackLayer(layers, { id: 'c', status: 'Downloading' });
    trackLayer(layers, { id: 'c', status: 'Downloading', progressDetail: {} });
    expect(summarizePullProgress(layers)).to.deep.equal({ progress: null, detail: '1/3 layers' });
    trackLayer(layers, { id: 'a', status: 'Downloading', progressDetail: { current: 25, total: 100 } });
    trackLayer(layers, { id: 'c', status: 'Downloading', progressDetail: { total: 300 } });
    expect(summarizePullProgress(layers)).to.deep.equal({ progress: 6, detail: '1/3 layers' });
    // a layer small enough to complete without any size announced
    trackLayer(layers, { id: 'd', status: 'Download complete' });
    trackLayer(layers, { id: 'a', status: 'Download complete' });
    trackLayer(layers, { id: 'a', status: 'Pull complete' });
    trackLayer(layers, { id: 'c', status: 'Extracting', progressDetail: { current: 10, total: 300 } });
    expect(summarizePullProgress(layers)).to.deep.equal({ progress: 100, detail: '2/4 layers' });
  });
});

describe('externalIntegration.pullAndStartSubContainer', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should download a missing image in the background, then create and start the container', async () => {
    const download = buildControlledPull();
    const { externalIntegration, system, variable, event } = buildSupervisor({
      system: { pull: download.pull, createContainer: fake.resolves({ id: 'mqtt-1' }) },
    });
    const service = await seedFrigateService();
    const result = await externalIntegration.controlSubContainer(service, 'mqtt', 'start', {
      env: { MQTT_PASSWORD: 's3cr3t' },
    });
    expect(result).to.deep.equal({ status: 'pulling' });
    assert.calledWith(system.pull, 'eclipse-mosquitto:2.0.18');
    assert.notCalled(system.createContainer);
    let [mqtt] = await externalIntegration.getSubContainersState(service);
    expect(mqtt).to.include({ status: 'pulling', desired: 'stopped', last_error: null });
    expect(mqtt.pull).to.deep.equal({ progress: null, detail: null });
    expect(containerUpdates(event)).to.deep.equal([
      {
        selector: service.selector,
        name: 'mqtt',
        status: 'pulling',
        pull: { progress: null, detail: null },
        last_error: null,
      },
    ]);

    download.onProgress({ status: 'Pulling from library/eclipse-mosquitto', id: '2.0.18' });
    download.onProgress({ id: 'l1', status: 'Downloading', progressDetail: { current: 50, total: 100 } });
    download.onProgress({ id: 'l2', status: 'Already exists' });
    [mqtt] = await externalIntegration.getSubContainersState(service);
    expect(mqtt.pull).to.deep.equal({ progress: 50, detail: '1/2 layers' });

    const { promise } = externalIntegration.subContainerPulls.get(`${service.id}:mqtt`);
    download.resolve([]);
    await promise;
    assert.calledOnce(system.createContainer);
    expect(system.createContainer.firstCall.args[0].Env).to.include('MQTT_PASSWORD=s3cr3t');
    assert.calledWith(system.restartContainer, 'mqtt-1');
    expect(JSON.parse(await variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id))).to.deep.equal({
      mqtt: 'running',
    });
    expect(externalIntegration.subContainerPulls.size).to.equal(0);
    const updates = containerUpdates(event);
    expect(updates[updates.length - 1]).to.deep.equal({
      selector: service.selector,
      name: 'mqtt',
      status: 'running',
      pull: null,
      last_error: null,
    });
  });

  it('should push the progress at most once per second', async () => {
    const clock = sinon.useFakeTimers({ now: 10000, toFake: ['Date'] });
    const download = buildControlledPull();
    const { externalIntegration, event } = buildSupervisor({ system: { pull: download.pull } });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    download.onProgress({ id: 'l1', status: 'Downloading', progressDetail: { current: 10, total: 100 } });
    download.onProgress({ id: 'l1', status: 'Downloading', progressDetail: { current: 20, total: 100 } });
    // ignored events push nothing
    download.onProgress({ status: 'Digest: sha256:abc' });
    expect(containerUpdates(event).map((payload) => payload.pull)).to.deep.equal([
      { progress: null, detail: null },
      { progress: 10, detail: '0/1 layers' },
    ]);
    clock.tick(1000);
    download.onProgress({ id: 'l1', status: 'Downloading', progressDetail: { current: 30, total: 100 } });
    expect(containerUpdates(event)).to.have.lengthOf(3);
    expect(containerUpdates(event)[2].pull).to.deep.equal({ progress: 30, detail: '0/1 layers' });
    const { promise } = externalIntegration.subContainerPulls.get(`${service.id}:mqtt`);
    download.resolve([]);
    await promise;
  });

  it('should leave the container stopped with last_error on a failed download, without counting a failure', async () => {
    const download = buildControlledPull();
    const imageExists = sinon.stub();
    imageExists.resolves(false);
    const { externalIntegration, system, variable, event } = buildSupervisor({
      system: { pull: download.pull, imageExists },
    });
    const service = await seedFrigateService({ failure_count: 0 });
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    const { promise } = externalIntegration.subContainerPulls.get(`${service.id}:mqtt`);
    download.reject(new Error('no matching manifest for linux/arm64'));
    await promise;
    assert.notCalled(system.createContainer);
    const [mqtt] = await externalIntegration.getSubContainersState(service);
    expect(mqtt).to.include({ status: 'stopped', desired: 'stopped', last_error: 'UNABLE_TO_PULL_IMAGE' });
    expect(mqtt.pull).to.equal(null);
    expect(await variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id)).to.equal(null);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.failure_count).to.equal(0);
    const updates = containerUpdates(event);
    expect(updates[updates.length - 1]).to.include({ status: 'stopped', last_error: 'UNABLE_TO_PULL_IMAGE' });
    // the next start finds the image (pulled by hand, network back): the error is cleared
    imageExists.resolves(true);
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    const [restarted] = await externalIntegration.getSubContainersState(service);
    expect(restarted.last_error).to.equal(null);
  });

  it('should record the start failure that follows a successful download', async () => {
    const { externalIntegration } = buildSupervisor({
      system: { createContainer: fake.rejects(new Error('CANNOT_CREATE')) },
    });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    await externalIntegration.subContainerPulls.get(`${service.id}:mqtt`).promise;
    const [mqtt] = await externalIntegration.getSubContainersState(service);
    expect(mqtt).to.include({ status: 'stopped', last_error: 'UNABLE_TO_START_CONTAINER' });
    // a stop clears it
    await externalIntegration.controlSubContainer(service, 'mqtt', 'stop');
    const [stopped] = await externalIntegration.getSubContainersState(service);
    expect(stopped.last_error).to.equal(null);
  });

  it('should join the download in flight instead of pulling twice', async () => {
    const download = buildControlledPull();
    const { externalIntegration, system } = buildSupervisor({
      system: { pull: download.pull, createContainer: fake.resolves({ id: 'mqtt-1' }) },
    });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start', { env: { FIRST: '1' } });
    const second = await externalIntegration.controlSubContainer(service, 'mqtt', 'start', { env: { SECOND: '2' } });
    // a restart carries no env: the last one provided is kept
    const third = await externalIntegration.controlSubContainer(service, 'mqtt', 'restart');
    expect(second).to.deep.equal({ status: 'pulling' });
    expect(third).to.deep.equal({ status: 'pulling' });
    assert.calledOnce(system.pull);
    const { promise } = externalIntegration.subContainerPulls.get(`${service.id}:mqtt`);
    download.resolve([]);
    await promise;
    assert.calledOnce(system.createContainer);
    const { Env } = system.createContainer.firstCall.args[0];
    expect(Env).to.include('SECOND=2');
    expect(Env).to.not.include('FIRST=1');
  });

  it('should abort the download on stop and never create the container', async () => {
    const download = buildControlledPull();
    const { externalIntegration, system, event } = buildSupervisor({ system: { pull: download.pull } });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    const result = await externalIntegration.controlSubContainer(service, 'mqtt', 'stop');
    expect(result).to.deep.equal({ status: 'stopped' });
    expect(download.abortSignal.aborted).to.equal(true);
    const [mqtt] = await externalIntegration.getSubContainersState(service);
    expect(mqtt).to.include({ status: 'stopped', last_error: null });
    const updates = containerUpdates(event);
    expect(updates[updates.length - 1]).to.include({ status: 'stopped', last_error: null });
    assert.notCalled(system.createContainer);
    expect(externalIntegration.cancelledSubContainerPulls.size).to.equal(0);
  });

  it('should not create the container when the last bytes arrive with the stop', async () => {
    const download = buildControlledPull({ onAbort: 'resolve' });
    const { externalIntegration, system, event } = buildSupervisor({ system: { pull: download.pull } });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    await externalIntegration.controlSubContainer(service, 'mqtt', 'stop');
    assert.notCalled(system.createContainer);
    // only the stop pushed the end of the download
    expect(containerUpdates(event).map((payload) => payload.status)).to.deep.equal(['pulling', 'stopped']);
  });

  it('should abort the downloads when the integration stops or is removed', async () => {
    const download = buildControlledPull();
    const { externalIntegration, system } = buildSupervisor({ system: { pull: download.pull } });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    const { promise } = externalIntegration.subContainerPulls.get(`${service.id}:mqtt`);
    await externalIntegration.stopSubContainers(service);
    expect(download.abortSignal.aborted).to.equal(true);
    // the aborted download rejected before the stop resolved: not an error to report
    await promise;
    const [mqtt] = await externalIntegration.getSubContainersState(service);
    expect(mqtt).to.include({ status: 'stopped', last_error: null });

    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    await externalIntegration.removeSubContainers(service);
    expect(download.abortSignal.aborted).to.equal(true);
    expect(externalIntegration.subContainerPulls.size).to.equal(0);
    assert.notCalled(system.createContainer);
  });

  it('should start synchronously when the presence of the image cannot be checked', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: { imageExists: fake.rejects(new Error('DOCKER_DOWN')), createContainer: fake.resolves({ id: 'mqtt-1' }) },
    });
    const service = await seedFrigateService();
    const result = await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    expect(result).to.deep.equal({ status: 'running' });
    assert.notCalled(system.pull);
    assert.calledWith(system.restartContainer, 'mqtt-1');
  });

  it('should remove the container a stop overtook while it was being started', async () => {
    const docker = buildControlledDocker();
    const download = buildControlledPull();
    const { externalIntegration, variable, event } = buildSupervisor({
      system: { pull: download.pull, ...docker.system },
    });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    download.resolve([]);
    // the image is on the disk, the container created, its start in progress
    await docker.restartCalled;
    expect(docker.containers).to.deep.equal([{ id: 'mqtt-1' }]);
    let stopped = false;
    const stop = (async () => {
      const result = await externalIntegration.controlSubContainer(service, 'mqtt', 'stop');
      stopped = true;
      return result;
    })();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    // the stop waits for the start it cancelled
    expect(stopped).to.equal(false);
    docker.restartSettle.resolve();
    expect(await stop).to.deep.equal({ status: 'stopped' });
    assert.calledWith(docker.system.removeContainer, 'mqtt-1', { force: true });
    expect(docker.containers).to.deep.equal([]);
    expect(JSON.parse(await variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id))).to.deep.equal({
      mqtt: 'stopped',
    });
    const [mqtt] = await externalIntegration.getSubContainersState(service);
    expect(mqtt).to.include({ status: 'stopped', desired: 'stopped', last_error: null });
    expect(containerUpdates(event).map((payload) => payload.status)).to.deep.equal(['pulling', 'stopped']);
  });

  it('should leave nothing behind when the integration is uninstalled while the container starts', async () => {
    const docker = buildControlledDocker();
    const download = buildControlledPull();
    const { externalIntegration, variable } = buildSupervisor({
      system: { pull: download.pull, ...docker.system },
    });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    download.resolve([]);
    await docker.restartCalled;
    const removal = externalIntegration.removeSubContainers(service);
    await waitUntil(() => externalIntegration.subContainerPulls.size === 0);
    docker.restartSettle.resolve();
    await removal;
    expect(docker.containers).to.deep.equal([]);
    expect(await variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id)).to.equal(null);
    expect(externalIntegration.subContainerPulls.size).to.equal(0);
  });

  it('should keep going when the overtaken container cannot be removed', async () => {
    const docker = buildControlledDocker();
    docker.system.removeContainer = sinon.stub().rejects(new Error('DOCKER_DOWN'));
    const download = buildControlledPull();
    const { externalIntegration, variable } = buildSupervisor({
      system: { pull: download.pull, ...docker.system },
    });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    download.resolve([]);
    await docker.restartCalled;
    const stop = externalIntegration.controlSubContainer(service, 'mqtt', 'stop');
    docker.restartSettle.resolve();
    expect(await stop).to.deep.equal({ status: 'stopped' });
    expect(JSON.parse(await variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id))).to.deep.equal({
      mqtt: 'stopped',
    });
  });

  it('should not record a start failure that follows a stop', async () => {
    const docker = buildControlledDocker();
    const download = buildControlledPull();
    const { externalIntegration, system } = buildSupervisor({ system: { pull: download.pull, ...docker.system } });
    const service = await seedFrigateService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    download.resolve([]);
    await docker.restartCalled;
    const stop = externalIntegration.controlSubContainer(service, 'mqtt', 'stop');
    docker.restartSettle.reject(new Error('CANNOT_START'));
    await stop;
    const [mqtt] = await externalIntegration.getSubContainersState(service);
    expect(mqtt).to.include({ desired: 'stopped', last_error: null });
    // the created container is the stop's to handle: stopped, not removed
    assert.calledWith(system.stopContainer, 'mqtt-1');
    assert.notCalled(docker.system.removeContainer);
  });

  it('should make a start wait for the download a stop is cancelling', async () => {
    const docker = buildControlledDocker();
    const download = buildControlledPull();
    const { externalIntegration } = buildSupervisor({
      system: { pull: download.pull, imageExists: fake.resolves(true), ...docker.system },
    });
    const service = await seedFrigateService();
    // the image is on the disk: only a pull already in flight runs in the background
    externalIntegration.pullAndStartSubContainer(service, TEST_CONTAINERS_MANIFEST.containers[0]);
    download.resolve([]);
    await docker.restartCalled;
    const stop = externalIntegration.controlSubContainer(service, 'mqtt', 'stop');
    const start = externalIntegration.controlSubContainer(service, 'mqtt', 'start');
    docker.restartSettle.resolve();
    await stop;
    // the second start reaches the daemon after the discard of the first container
    await waitUntil(() => docker.system.restartContainer.callCount === 2);
    docker.restartSettle.resolve();
    expect(await start).to.deep.equal({ status: 'running' });
    const [removal] = docker.system.removeContainer.getCalls();
    expect(removal.calledBefore(docker.system.createContainer.secondCall)).to.equal(true);
    expect(docker.containers).to.deep.equal([{ id: 'mqtt-2' }]);
  });
});

describe('externalIntegration.ensureImage', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should fall back on a local image when the pull fails (dev install)', async () => {
    const { externalIntegration } = buildSupervisor({
      system: { pull: fake.rejects(new Error('NOT_FOUND')), imageExists: fake.resolves(true) },
    });
    await externalIntegration.ensureImage('my-integration:dev', { allowLocal: true });
  });

  it('should rethrow an aborted download, even with a local image', async () => {
    const abortController = new AbortController();
    const abortError = new Error('The operation was aborted');
    const imageExists = fake.resolves(true);
    const { externalIntegration } = buildSupervisor({
      system: {
        pull: fake(async () => {
          abortController.abort();
          throw abortError;
        }),
        imageExists,
      },
    });
    let thrown = null;
    try {
      await externalIntegration.ensureImage('my-integration:dev', {
        allowLocal: true,
        abortSignal: abortController.signal,
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.equal(abortError);
    assert.notCalled(imageExists);
  });
});
