const { expect } = require('chai');

const { SERVICE_STATUS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.restart', () => {
  it('should stop then start the integration', async () => {
    const service = await seedExternalService();
    const { externalIntegration, system } = buildSupervisor();
    const integration = await externalIntegration.restart(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.LOADING);
    expect(system.stopContainer.called).to.equal(true);
    expect(system.restartContainer.called).to.equal(true);
    externalIntegration.clearTimers(service.id);
  });
});
