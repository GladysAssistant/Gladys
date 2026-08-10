const { expect } = require('chai');
const { assert: sinonAssert, fake } = require('sinon');

const { NotFoundError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.getLogs', () => {
  it('should return the container logs', async () => {
    const service = await seedExternalService();
    const { externalIntegration, system } = buildSupervisor();
    const logs = await externalIntegration.getLogs(service.selector, 50);
    expect(logs).to.equal('log line');
    sinonAssert.calledWith(system.getContainerLogs, 'container-1', { follow: false, tail: 50 });
  });

  it('should demultiplex Docker framed logs', async () => {
    const service = await seedExternalService();
    const payload = Buffer.from('hello');
    const frame = Buffer.concat([Buffer.from([1, 0, 0, 0, 0, 0, 0, payload.length]), payload]);
    const { externalIntegration } = buildSupervisor({
      system: {
        getContainerLogs: fake.resolves(frame),
      },
    });
    const logs = await externalIntegration.getLogs(service.selector);
    expect(logs).to.equal('hello');
  });

  it('should throw when the integration has no container', async () => {
    const service = await seedExternalService({ container_id: null });
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.getLogs(service.selector);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }
  });

  it('should read the logs of a declared sub-container', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration, system } = buildSupervisor({
      system: {
        getContainers: fake.resolves([{ id: 'mqtt-1' }]),
        getContainerLogs: fake.resolves(Buffer.from('mqtt logs')),
      },
    });
    const logs = await externalIntegration.getLogs(service.selector, 50, 'mqtt');
    expect(logs).to.equal('mqtt logs');
    expect(system.getContainerLogs.firstCall.args[0]).to.equal('mqtt-1');
  });

  it('should throw on an undeclared or never-created sub-container', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.getLogs(service.selector, 50, 'unknown');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
      expect(e.message).to.equal('SUB_CONTAINER_NOT_FOUND');
    }
    try {
      await externalIntegration.getLogs(service.selector, 50, 'mqtt');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_HAS_NO_CONTAINER');
    }
  });
});
