const fs = require('fs');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

const BASE = '/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo';

describe('externalIntegration.ensureSubContainerVolumes', () => {
  let originalMkdir;
  let originalChown;
  let originalStat;

  beforeEach(() => {
    originalMkdir = fs.promises.mkdir;
    originalChown = fs.promises.chown;
    originalStat = fs.promises.stat;
  });

  afterEach(() => {
    fs.promises.mkdir = originalMkdir;
    fs.promises.chown = originalChown;
    fs.promises.stat = originalStat;
  });

  it('should create each volume folder level and hand it to the node user (uid 1000)', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const mkdir = fake.resolves(undefined);
    const chown = fake.resolves(undefined);
    fs.promises.mkdir = mkdir;
    fs.promises.chown = chown;
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.ensureSubContainerVolumes(service, TEST_CONTAINERS_MANIFEST.containers[0]);
    sinonAssert.calledWith(chown, BASE, 1000, 1000);
    sinonAssert.calledWith(mkdir, `${BASE}/containers`);
    sinonAssert.calledWith(chown, `${BASE}/containers`, 1000, 1000);
    sinonAssert.calledWith(chown, `${BASE}/containers/mqtt`, 1000, 1000);
    sinonAssert.calledWith(chown, `${BASE}/containers/mqtt/mosquitto/config`, 1000, 1000);
    sinonAssert.calledWith(chown, `${BASE}/containers/mqtt/mosquitto/data`, 1000, 1000);
  });

  it('should repair an existing folder still owned by root', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const alreadyExists = Object.assign(new Error('EEXIST'), { code: 'EEXIST' });
    fs.promises.mkdir = fake((folder, options) => (options ? Promise.resolve() : Promise.reject(alreadyExists)));
    const chown = fake.resolves(undefined);
    fs.promises.chown = chown;
    fs.promises.stat = fake.resolves({ uid: 0 });
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.ensureSubContainerVolumes(service, TEST_CONTAINERS_MANIFEST.containers[0]);
    sinonAssert.calledWith(chown, `${BASE}/containers/mqtt/mosquitto/config`, 1000, 1000);
  });

  it('should leave an existing folder owned by another uid untouched', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const alreadyExists = Object.assign(new Error('EEXIST'), { code: 'EEXIST' });
    fs.promises.mkdir = fake((folder, options) => (options ? Promise.resolve() : Promise.reject(alreadyExists)));
    const chown = fake.resolves(undefined);
    fs.promises.chown = chown;
    fs.promises.stat = fake.resolves({ uid: 1883 });
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.ensureSubContainerVolumes(service, TEST_CONTAINERS_MANIFEST.containers[0]);
    // the only chown left is the one of the integration /data folder itself
    sinonAssert.calledOnceWithExactly(chown, BASE, 1000, 1000);
  });

  it('should not fail when the volume folders cannot be prepared', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    fs.promises.mkdir = fake((folder, options) => (options ? Promise.resolve() : Promise.reject(new Error('EACCES'))));
    fs.promises.chown = fake.resolves(undefined);
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.ensureSubContainerVolumes(service, TEST_CONTAINERS_MANIFEST.containers[0]);
  });

  it('should do nothing beyond the /data folder without declared volumes', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const mkdir = fake.resolves(undefined);
    fs.promises.mkdir = mkdir;
    fs.promises.chown = fake.resolves(undefined);
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.ensureSubContainerVolumes(service, { name: 'no-volumes' });
    sinonAssert.calledOnceWithExactly(mkdir, BASE, { recursive: true });
  });

  it('should prepare the volume folders before the sub-container is created', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    fs.promises.mkdir = fake.resolves(undefined);
    // deferred chown: proves the preparation is awaited, not just started
    let signalChownReached;
    const chownReached = new Promise((resolve) => {
      signalChownReached = resolve;
    });
    let resolveChown;
    const pendingChown = new Promise((resolve) => {
      resolveChown = resolve;
    });
    fs.promises.chown = fake(() => {
      signalChownReached();
      return pendingChown;
    });
    const { externalIntegration, system } = buildSupervisor();
    const creation = externalIntegration.createSubContainer(service, TEST_CONTAINERS_MANIFEST.containers[0], {});
    await chownReached;
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    sinonAssert.notCalled(system.createContainer);
    resolveChown();
    await creation;
    sinonAssert.calledOnce(system.createContainer);
  });
});
