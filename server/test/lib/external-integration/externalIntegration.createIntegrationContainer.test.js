const { expect } = require('chai');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.createIntegrationContainer', () => {
  it('should rotate the token and save the new container id', async () => {
    const service = await seedExternalService({ container_id: null, token_version: 4 });
    const { externalIntegration, system } = buildSupervisor();
    const container = await externalIntegration.createIntegrationContainer(service);
    expect(container).to.have.property('id', 'container-1');
    sinonAssert.notCalled(system.removeContainer);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.token_version).to.equal(5);
    expect(serviceInDb.container_id).to.equal('container-1');
  });

  it('should recreate the container even when the old one cannot be removed', async () => {
    const service = await seedExternalService({ container_id: 'old-container' });
    const { externalIntegration, system } = buildSupervisor({
      system: {
        removeContainer: fake.rejects(new Error('CANNOT_REMOVE')),
      },
    });
    const container = await externalIntegration.createIntegrationContainer(service);
    expect(container).to.have.property('id', 'container-1');
    sinonAssert.calledOnce(system.createContainer);
  });

  it('should connect the main container to the private network of a multi-container integration', async () => {
    const service = await seedExternalService({ container_id: null, manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration, system } = buildSupervisor();
    await externalIntegration.createIntegrationContainer(service);
    sinonAssert.calledWith(system.connectToNetwork, 'gladys-int-ext-dev-open-meteo-demo', 'container-1');
  });

  it('should not touch the private network without declared sub-containers', async () => {
    const service = await seedExternalService({ container_id: null });
    const { externalIntegration, system } = buildSupervisor();
    await externalIntegration.createIntegrationContainer(service);
    sinonAssert.notCalled(system.connectToNetwork);
  });
});
