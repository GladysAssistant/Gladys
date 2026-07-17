const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const db = require('../../../models');
const { SERVICE_STATUS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

const seedMultiContainerService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST, ...overrides });

describe('externalIntegration.checkSubContainersHealth', () => {
  it('should do nothing without declared containers', async () => {
    const { externalIntegration, system } = buildSupervisor();
    const service = await seedExternalService();
    await externalIntegration.checkSubContainersHealth(service);
    assert.notCalled(system.getContainers);
  });

  it('should schedule a restart for a desired-running container that exited', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        getContainers: fake.resolves([{ id: 'frigate-1' }]),
        inspectContainer: fake.resolves({ State: { Running: false } }),
      },
    });
    const service = await seedMultiContainerService();
    externalIntegration.scheduleSubContainerRestart = fake.resolves(null);
    await externalIntegration.checkSubContainersHealth(service);
    // mqtt is manual (desired stopped): only frigate is supervised
    assert.calledOnce(externalIntegration.scheduleSubContainerRestart);
    expect(externalIntegration.scheduleSubContainerRestart.firstCall.args[1].name).to.equal('frigate');
  });

  it('should schedule a restart when the container disappeared', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedMultiContainerService();
    externalIntegration.scheduleSubContainerRestart = fake.resolves(null);
    await externalIntegration.checkSubContainersHealth(service);
    assert.calledOnce(externalIntegration.scheduleSubContainerRestart);
  });

  it('should skip a healthy container, a pending restart and a transient inspect failure', async () => {
    const { externalIntegration } = buildSupervisor({
      system: { getContainers: fake.resolves([{ id: 'frigate-1' }]) },
    });
    const service = await seedMultiContainerService();
    externalIntegration.scheduleSubContainerRestart = fake.resolves(null);
    // healthy
    await externalIntegration.checkSubContainersHealth(service);
    assert.notCalled(externalIntegration.scheduleSubContainerRestart);
    // pending restart
    externalIntegration.restartTimers.set(`${service.id}:frigate`, setTimeout(() => {}, 100000));
    await externalIntegration.checkSubContainersHealth(service);
    assert.notCalled(externalIntegration.scheduleSubContainerRestart);
    externalIntegration.clearTimers(service.id);
    // transient inspect failure
    externalIntegration.system.inspectContainer = fake.rejects(new Error('TRANSIENT'));
    await externalIntegration.checkSubContainersHealth(service);
    assert.notCalled(externalIntegration.scheduleSubContainerRestart);
  });
});

describe('externalIntegration.scheduleSubContainerRestart', () => {
  it('should restart the sub-container after the backoff delay', async () => {
    const clock = sinon.useFakeTimers();
    const { externalIntegration } = buildSupervisor();
    const service = await seedMultiContainerService({ failure_count: 0 });
    const entry = TEST_CONTAINERS_MANIFEST.containers[1];
    externalIntegration.startSubContainer = fake.resolves(null);
    await externalIntegration.scheduleSubContainerRestart(service, entry);
    expect(externalIntegration.restartTimers.has(`${service.id}:frigate`)).to.equal(true);
    await clock.tickAsync(10 * 1000 + 1);
    clock.restore();
    assert.calledOnce(externalIntegration.startSubContainer);
    expect(externalIntegration.restartTimers.has(`${service.id}:frigate`)).to.equal(false);
    const updated = await db.Service.findOne({ where: { id: service.id } });
    expect(updated.failure_count).to.equal(1);
  });

  it('should replace a pending restart and survive a failing restart', async () => {
    const clock = sinon.useFakeTimers();
    const { externalIntegration } = buildSupervisor();
    const service = await seedMultiContainerService({ failure_count: 0 });
    const entry = TEST_CONTAINERS_MANIFEST.containers[1];
    externalIntegration.startSubContainer = fake.rejects(new Error('CANNOT_START'));
    await externalIntegration.scheduleSubContainerRestart(service, entry);
    await externalIntegration.scheduleSubContainerRestart(service, entry);
    await clock.tickAsync(60 * 1000);
    clock.restore();
    assert.calledOnce(externalIntegration.startSubContainer);
  });

  it('should give up and stop everything after too many failures', async () => {
    const { externalIntegration, system } = buildSupervisor();
    const service = await seedMultiContainerService({ failure_count: 4 });
    const entry = TEST_CONTAINERS_MANIFEST.containers[1];
    externalIntegration.stopSubContainers = fake.resolves(null);
    await externalIntegration.scheduleSubContainerRestart(service, entry);
    const updated = await db.Service.findOne({ where: { id: service.id } });
    expect(updated.status).to.equal(SERVICE_STATUS.ERROR);
    assert.calledWith(system.stopContainer, 'container-1');
    assert.calledOnce(externalIntegration.stopSubContainers);
  });

  it('should give up even when the main container cannot be stopped', async () => {
    const { externalIntegration } = buildSupervisor({
      system: { stopContainer: fake.rejects(new Error('CANNOT_STOP')) },
    });
    const service = await seedMultiContainerService({ failure_count: 4 });
    const entry = TEST_CONTAINERS_MANIFEST.containers[1];
    externalIntegration.stopSubContainers = fake.resolves(null);
    await externalIntegration.scheduleSubContainerRestart(service, entry);
    const updated = await db.Service.findOne({ where: { id: service.id } });
    expect(updated.status).to.equal(SERVICE_STATUS.ERROR);
  });
});
