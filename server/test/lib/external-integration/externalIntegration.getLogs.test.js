const { expect } = require('chai');
const { assert: sinonAssert, fake } = require('sinon');

const { NotFoundError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

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
});
