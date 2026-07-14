const { expect } = require('chai');
const sinon = require('sinon');
const { fake } = require('sinon');

const db = require('../../../models');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.init', () => {
  it('should register proxies, create the network and reconcile containers', async () => {
    const service = await seedExternalService({ container_id: 'old-container-id' });
    const { externalIntegration, stateManager } = buildSupervisor({
      system: {
        getContainers: fake.resolves([
          { id: 'new-container-id', name: '/gladys-ext-dev-open-meteo-demo', state: 'running' },
        ]),
      },
    });
    externalIntegration.refreshIndex = fake.rejects(new Error('offline'));
    await externalIntegration.init();
    expect(externalIntegration.available).to.equal(true);
    expect(stateManager.get('service', service.name)).to.not.equal(null);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.container_id).to.equal('new-container-id');
    expect(externalIntegration.checkHealthInterval).to.not.equal(null);
    clearInterval(externalIntegration.checkHealthInterval);
    clearInterval(externalIntegration.storeRefreshInterval);
  });

  it('should clear an obsolete container_id when the container is gone', async () => {
    const service = await seedExternalService({ container_id: 'gone-container' });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.refreshIndex = fake.rejects(new Error('offline'));
    await externalIntegration.init();
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.container_id).to.equal(null);
    clearInterval(externalIntegration.checkHealthInterval);
    clearInterval(externalIntegration.storeRefreshInterval);
  });

  it('should be a no-op supervisor without Docker socket', async () => {
    await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        dockerode: null,
      },
    });
    externalIntegration.refreshIndex = fake.rejects(new Error('offline'));
    await externalIntegration.init();
    expect(externalIntegration.available).to.equal(false);
    expect(externalIntegration.checkHealthInterval).to.equal(null);
    clearInterval(externalIntegration.storeRefreshInterval);
  });

  it('should disable itself when the network cannot be created', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        createNetwork: fake.rejects(new Error('CANNOT_CREATE_NETWORK')),
      },
    });
    externalIntegration.refreshIndex = fake.rejects(new Error('offline'));
    await externalIntegration.init();
    expect(externalIntegration.available).to.equal(false);
    clearInterval(externalIntegration.storeRefreshInterval);
  });

  it('should periodically refresh the store index and check health', async () => {
    const clock = sinon.useFakeTimers();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.refreshIndex = fake.rejects(new Error('offline'));
    externalIntegration.checkHealth = fake.resolves(null);
    await externalIntegration.init();
    // no initial refresh: the first fetch is lazy, the boot never touches the network
    expect(externalIntegration.refreshIndex.callCount).to.equal(0);
    // the interval callbacks invoke the fakes synchronously when they fire,
    // and tickAsync flushes their promise chains: no real-time wait needed
    await clock.tickAsync(12 * 60 * 60 * 1000 + 1000);
    clock.restore();
    expect(externalIntegration.refreshIndex.callCount).to.be.at.least(1);
    expect(externalIntegration.checkHealth.callCount).to.be.at.least(1);
    clearInterval(externalIntegration.checkHealthInterval);
    clearInterval(externalIntegration.storeRefreshInterval);
  });

  it('should survive a failing periodic health check', async () => {
    const clock = sinon.useFakeTimers();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.refreshIndex = fake.rejects(new Error('offline'));
    externalIntegration.checkHealth = fake.rejects(new Error('CANNOT_CHECK'));
    await externalIntegration.init();
    await clock.tickAsync(31 * 1000);
    clock.restore();
    expect(externalIntegration.checkHealth.callCount).to.be.at.least(1);
    clearInterval(externalIntegration.checkHealthInterval);
    clearInterval(externalIntegration.storeRefreshInterval);
  });

  it('should survive a container reconciliation failure', async () => {
    await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        getContainers: fake.rejects(new Error('CANNOT_LIST')),
      },
    });
    externalIntegration.refreshIndex = fake.rejects(new Error('offline'));
    await externalIntegration.init();
    expect(externalIntegration.available).to.equal(true);
    clearInterval(externalIntegration.checkHealthInterval);
    clearInterval(externalIntegration.storeRefreshInterval);
  });
});
