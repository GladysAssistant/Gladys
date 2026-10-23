const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { SERVICE_STATUS } = require('../../../utils/constants');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.stop', () => {
  it('should stop the container, close the connection and set STOPPED', async () => {
    const service = await seedExternalService();
    const { externalIntegration, system } = buildSupervisor();
    const connection = { terminate: fake.returns(null) };
    externalIntegration.connections.set(service.id, connection);
    const integration = await externalIntegration.stop(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.STOPPED);
    sinonAssert.calledWith(system.stopContainer, 'container-1');
    sinonAssert.calledOnce(connection.terminate);
    expect(externalIntegration.connections.has(service.id)).to.equal(false);
  });

  it('should drop the designated features and their read rate limits, the close handler being skipped', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const rateLimit = () => ({ count: 1, resetAt: Date.now() + 60 * 1000 });
    externalIntegration.connections.set(service.id, { terminate: fake.returns(null) });
    externalIntegration.deviceFeatureReadGrants.set(service.id, { service, selectors: new Set(['a']) });
    externalIntegration.deviceFeatureReadGrants.set('other-service-id', { service: {}, selectors: new Set(['a']) });
    externalIntegration.deviceFeatureStateRateLimits.set(service.id, rateLimit());
    externalIntegration.deviceFeatureAggregateRateLimits.set(service.id, rateLimit());
    await externalIntegration.stop(service.selector);
    expect(externalIntegration.deviceFeatureReadGrants.has(service.id)).to.equal(false);
    expect(externalIntegration.deviceFeatureReadGrants.has('other-service-id')).to.equal(true);
    expect(externalIntegration.deviceFeatureStateRateLimits.has(service.id)).to.equal(false);
    expect(externalIntegration.deviceFeatureAggregateRateLimits.has(service.id)).to.equal(false);
  });

  it('should still set STOPPED when the websocket cannot be terminated', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.connections.set(service.id, {
      terminate: () => {
        throw new Error('CANNOT_TERMINATE');
      },
    });
    const integration = await externalIntegration.stop(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.STOPPED);
  });

  it('should still set STOPPED when the container cannot be stopped', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        stopContainer: fake.rejects(new Error('CANNOT_STOP')),
      },
    });
    const integration = await externalIntegration.stop(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.STOPPED);
  });

  it('should log quietly when Docker is not available', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        stopContainer: fake.rejects(new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER')),
      },
    });
    const integration = await externalIntegration.stop(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.STOPPED);
  });

  it('should set STOPPED even without container', async () => {
    const service = await seedExternalService({ container_id: null });
    const { externalIntegration, system } = buildSupervisor();
    const integration = await externalIntegration.stop(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.STOPPED);
    sinonAssert.notCalled(system.stopContainer);
  });

  it('should stop the sub-containers after the main container', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.stopSubContainers = fake.resolves(null);
    const integration = await externalIntegration.stop(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.STOPPED);
    sinonAssert.calledOnce(externalIntegration.stopSubContainers);
  });

  it('should set STOPPED even when the sub-containers cannot be stopped', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.stopSubContainers = fake.rejects(new Error('CANNOT_STOP'));
    const integration = await externalIntegration.stop(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.STOPPED);
  });
});
