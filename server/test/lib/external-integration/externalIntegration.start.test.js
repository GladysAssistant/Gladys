const { expect } = require('chai');
const sinon = require('sinon');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { PlatformNotCompatible, NotFoundError } = require('../../../utils/coreErrors');
const { SERVICE_STATUS } = require('../../../utils/constants');
const { generateIntegrationToken } = require('../../../utils/integrationToken');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST, TEST_JWT_SECRET } = require('./testUtils.test');

describe('externalIntegration.start', () => {
  let clock;

  afterEach(() => {
    if (clock) {
      clock.restore();
      clock = null;
    }
  });

  it('should restart the existing container and set status LOADING', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.STOPPED });
    const { externalIntegration, system } = buildSupervisor();
    const integration = await externalIntegration.start(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.LOADING);
    sinonAssert.calledWith(system.restartContainer, 'container-1');
    sinonAssert.notCalled(system.createContainer);
    expect(externalIntegration.startupTimers.has(service.id)).to.equal(true);
    externalIntegration.clearTimers(service.id);
  });

  it('should recreate the container when it holds a stale integration token', async () => {
    const service = await seedExternalService();
    const { externalIntegration, system } = buildSupervisor({
      system: {
        // token signed with the JWT secret of a previous boot (before the
        // secret was persisted): restarting the container would only loop
        // on "authentication refused (close code 4000)"
        inspectContainer: fake.resolves({
          State: { Running: true },
          Config: { Env: [`GLADYS_INTEGRATION_TOKEN=stale-token`] },
        }),
      },
    });
    await externalIntegration.start(service.selector);
    sinonAssert.calledOnce(system.createContainer);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.token_version).to.equal(2);
    externalIntegration.clearTimers(service.id);
  });

  it('should recreate the container when its env holds no integration token at all', async () => {
    const service = await seedExternalService();
    const { externalIntegration, system } = buildSupervisor({
      system: {
        inspectContainer: fake.resolves({ State: { Running: true }, Config: { Env: ['OTHER=1'] } }),
      },
    });
    await externalIntegration.start(service.selector);
    sinonAssert.calledOnce(system.createContainer);
    externalIntegration.clearTimers(service.id);
  });

  it('should recreate the container when it belongs to another service or token version', async () => {
    const service = await seedExternalService();
    const otherServiceToken = generateIntegrationToken('e2c85162-9d92-4d24-a778-98b4d2ec7568', 1, TEST_JWT_SECRET);
    const { externalIntegration, system } = buildSupervisor({
      system: {
        inspectContainer: fake.resolves({
          State: { Running: true },
          Config: { Env: [`GLADYS_INTEGRATION_TOKEN=${otherServiceToken}`] },
        }),
      },
    });
    await externalIntegration.start(service.selector);
    sinonAssert.calledOnce(system.createContainer);
    externalIntegration.clearTimers(service.id);
  });

  it('should recreate the container when the existing one is gone', async () => {
    const service = await seedExternalService();
    const { externalIntegration, system } = buildSupervisor({
      system: {
        restartContainer: sinon
          .stub()
          .onFirstCall()
          .rejects(new Error('404'))
          .onSecondCall()
          .resolves(true),
      },
    });
    await externalIntegration.start(service.selector);
    sinonAssert.calledOnce(system.createContainer);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    // token was rotated at container recreation
    expect(serviceInDb.token_version).to.equal(2);
    expect(serviceInDb.container_id).to.equal('container-1');
    externalIntegration.clearTimers(service.id);
  });

  it('should reset failure_count on manual start', async () => {
    const service = await seedExternalService({ failure_count: 5, status: SERVICE_STATUS.ERROR });
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.start(service.selector);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.failure_count).to.equal(0);
    externalIntegration.clearTimers(service.id);
  });

  it('should keep failure_count on supervised restart', async () => {
    const service = await seedExternalService({ failure_count: 2 });
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.start(service.selector, { resetFailureCount: false });
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.failure_count).to.equal(2);
    externalIntegration.clearTimers(service.id);
  });

  it('should set the integration DEGRADED when nothing proves it alive within 60s', async () => {
    clock = sinon.useFakeTimers();
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.start(service.selector);
    await clock.tickAsync(61 * 1000);
    clock.restore();
    clock = null;
    // let the async handleStartupTimeout finish
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.DEGRADED);
  });

  it('should not degrade the integration when it connected during startup', async () => {
    clock = sinon.useFakeTimers();
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.start(service.selector);
    externalIntegration.connections.set(service.id, { readyState: 1 });
    await db.Service.update({ status: SERVICE_STATUS.RUNNING }, { where: { id: service.id } });
    await clock.tickAsync(61 * 1000);
    clock.restore();
    clock = null;
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.RUNNING);
  });

  it('should ignore a startup timeout of a destroyed integration', async () => {
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.handleStartupTimeout({
      id: '4756151c-369e-4fbd-8794-1c4a55b4c8f9',
      selector: 'ext-gone',
    });
  });

  it('should survive an error while handling the startup timeout', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.LOADING });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.saveStatus = fake.rejects(new Error('CANNOT_SAVE'));
    externalIntegration.startedAt.set(service.id, Date.now());
    await externalIntegration.handleStartupTimeout(service);
  });

  it('should throw when Docker is not available', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.available = false;
    try {
      await externalIntegration.start(service.selector);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should throw on unknown integration', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.start('ext-unknown');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }
  });

  it('should set ERROR when the container cannot be started at all', async () => {
    const service = await seedExternalService({ container_id: null });
    const { externalIntegration } = buildSupervisor({
      system: {
        createContainer: fake.rejects(new Error('CANNOT_CREATE')),
      },
    });
    try {
      await externalIntegration.start(service.selector);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.message).to.equal('CANNOT_CREATE');
    }
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.ERROR);
  });

  it('should start the desired sub-containers before the main container', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.ensureSubContainers = fake.resolves(null);
    await externalIntegration.start(service.selector);
    sinonAssert.calledOnce(externalIntegration.ensureSubContainers);
    externalIntegration.clearTimers(service.id);
  });

  it('should still start the main container when the sub-containers fail', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.ensureSubContainers = fake.rejects(new Error('CANNOT_START_SUB'));
    const integration = await externalIntegration.start(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.LOADING);
    sinonAssert.calledWith(system.restartContainer, 'container-1');
    externalIntegration.clearTimers(service.id);
  });
});
