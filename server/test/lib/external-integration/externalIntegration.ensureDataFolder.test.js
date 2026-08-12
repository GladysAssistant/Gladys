const fs = require('fs');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.ensureDataFolder', () => {
  let originalMkdir;
  let originalChown;

  beforeEach(() => {
    originalMkdir = fs.promises.mkdir;
    originalChown = fs.promises.chown;
  });

  afterEach(() => {
    fs.promises.mkdir = originalMkdir;
    fs.promises.chown = originalChown;
  });

  it('should create the data folder and hand it to the node user (uid 1000)', async () => {
    const service = await seedExternalService();
    const mkdir = fake.resolves(undefined);
    const chown = fake.resolves(undefined);
    fs.promises.mkdir = mkdir;
    fs.promises.chown = chown;
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.ensureDataFolder(service);
    sinonAssert.calledWith(mkdir, '/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo', {
      recursive: true,
    });
    sinonAssert.calledWith(chown, '/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo', 1000, 1000);
  });

  it('should not fail when the folder cannot be prepared', async () => {
    const service = await seedExternalService();
    fs.promises.mkdir = fake.resolves(undefined);
    fs.promises.chown = fake.rejects(new Error('EPERM'));
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.ensureDataFolder(service);
  });

  it('should prepare the data folder before the container is created', async () => {
    const service = await seedExternalService({ container_id: null });
    fs.promises.mkdir = fake.resolves(undefined);
    // deferred chown: proves the preparation is awaited, not just started —
    // the container must not be created while the chown is still pending
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
    const creation = externalIntegration.createIntegrationContainer(service);
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
