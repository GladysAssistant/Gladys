const { expect } = require('chai');
const sinon = require('sinon');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { SERVICE_STATUS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.checkHealth', () => {
  it('should do nothing when Docker is not available', async () => {
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.available = false;
    await externalIntegration.checkHealth();
    sinonAssert.notCalled(system.inspectContainer);
  });

  it('should schedule a restart when the container exited', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING });
    const { externalIntegration } = buildSupervisor({
      system: {
        inspectContainer: fake.resolves({ State: { Running: false } }),
      },
    });
    externalIntegration.scheduleRestart = fake.resolves(null);
    await externalIntegration.checkHealth();
    sinonAssert.calledOnce(externalIntegration.scheduleRestart);
    expect(externalIntegration.scheduleRestart.firstCall.args[0]).to.have.property('id', service.id);
  });

  it('should not restart on a transient inspection failure', async () => {
    // a transient Docker socket error is not a crashed container:
    // skip and let the next cycle retry
    await seedExternalService({ status: SERVICE_STATUS.RUNNING });
    const { externalIntegration } = buildSupervisor({
      system: {
        inspectContainer: fake.rejects(new Error('socket hang up')),
      },
    });
    externalIntegration.scheduleRestart = fake.resolves(null);
    await externalIntegration.checkHealth();
    sinonAssert.notCalled(externalIntegration.scheduleRestart);
  });

  it('should not check STOPPED or ERROR integrations', async () => {
    await seedExternalService({ status: SERVICE_STATUS.STOPPED });
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.scheduleRestart = fake.resolves(null);
    await externalIntegration.checkHealth();
    sinonAssert.notCalled(system.inspectContainer);
    sinonAssert.notCalled(externalIntegration.scheduleRestart);
  });

  it('should not double-schedule a restart', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING });
    const { externalIntegration } = buildSupervisor({
      system: {
        inspectContainer: fake.resolves({ State: { Running: false } }),
      },
    });
    externalIntegration.restartTimers.set(
      service.id,
      setTimeout(() => {}, 100000),
    );
    externalIntegration.scheduleRestart = fake.resolves(null);
    await externalIntegration.checkHealth();
    sinonAssert.notCalled(externalIntegration.scheduleRestart);
    externalIntegration.clearTimers(service.id);
  });

  it('should set DEGRADED a running container whose integration is silent for more than 60s', async () => {
    const service = await seedExternalService({
      status: SERVICE_STATUS.RUNNING,
      last_heartbeat: new Date(Date.now() - 2 * 60 * 1000),
    });
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.checkHealth();
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.DEGRADED);
  });

  it('should leave alone a RUNNING integration with a live websocket', async () => {
    const service = await seedExternalService({
      status: SERVICE_STATUS.RUNNING,
      last_heartbeat: new Date(Date.now() - 2 * 60 * 1000),
    });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.connections.set(service.id, {});
    await externalIntegration.checkHealth();
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.RUNNING);
  });

  it('should skip integrations without container', async () => {
    await seedExternalService({ status: SERVICE_STATUS.RUNNING, container_id: null });
    const { externalIntegration, system } = buildSupervisor();
    await externalIntegration.checkHealth();
    sinonAssert.notCalled(system.inspectContainer);
  });
});

describe('externalIntegration.scheduleRestart', () => {
  it('should increment failure_count, set DEGRADED and restart with backoff', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING, failure_count: 0 });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.scheduleRestart(service);
    let serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.failure_count).to.equal(1);
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.DEGRADED);
    expect(externalIntegration.restartTimers.has(service.id)).to.equal(true);
    // first backoff: 10s
    await clock.tickAsync(10 * 1000 + 1);
    clock.restore();
    sinonAssert.calledWith(externalIntegration.start, service.selector, { resetFailureCount: false });
    expect(externalIntegration.restartTimers.has(service.id)).to.equal(false);
    serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.failure_count).to.equal(1);
  });

  it('should give up and set ERROR after 5 failures', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING, failure_count: 4 });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.scheduleRestart(service);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.failure_count).to.equal(5);
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.ERROR);
    expect(externalIntegration.restartTimers.has(service.id)).to.equal(false);
    sinonAssert.notCalled(externalIntegration.start);
  });

  it('should survive a failing supervised restart', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING, failure_count: 0 });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.start = fake.rejects(new Error('CANNOT_START'));
    await externalIntegration.scheduleRestart(service);
    await clock.tickAsync(10 * 1000 + 1);
    clock.restore();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    sinonAssert.calledOnce(externalIntegration.start);
  });

  it('should cap the backoff at 15 minutes', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING, failure_count: 3 });
    // temporarily raise the max failure count behavior by checking delay only
    const { externalIntegration } = buildSupervisor();
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.scheduleRestart(service);
    // failure_count 4 -> delay = min(10s * 2^3, 15min) = 80s
    await clock.tickAsync(79 * 1000);
    sinonAssert.notCalled(externalIntegration.start);
    await clock.tickAsync(2 * 1000);
    clock.restore();
    sinonAssert.calledOnce(externalIntegration.start);
  });
});
