const { expect } = require('chai');
const { assert: sinonAssert, fake } = require('sinon');

const { SERVICE_STATUS } = require('../../../utils/constants');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

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
});
