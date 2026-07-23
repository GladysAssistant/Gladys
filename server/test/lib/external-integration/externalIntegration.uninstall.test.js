const fs = require('fs');
const { expect } = require('chai');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { NotFoundError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.uninstall', () => {
  it('should remove container, devices, variables and the service row', async () => {
    const service = await seedExternalService();
    const { externalIntegration, system, device, stateManager, variable } = buildSupervisor();
    externalIntegration.registerProxyService(service);
    externalIntegration.discoveredDevices.set(service.id, []);
    const connection = { terminate: fake.returns(null) };
    externalIntegration.connections.set(service.id, connection);
    await db.Device.create({
      service_id: service.id,
      name: 'Test device',
      selector: 'ext-test-device',
      external_id: `ext:${service.selector}:test`,
    });
    await variable.setValue('LATITUDE', '48.85', service.id);

    await externalIntegration.uninstall(service.selector);

    sinonAssert.calledWith(system.removeContainer, 'container-1', { force: true });
    sinonAssert.calledOnce(connection.terminate);
    sinonAssert.calledWith(device.destroy, 'ext-test-device');
    const variables = await db.Variable.findAll({ where: { service_id: service.id } });
    expect(variables).to.have.lengthOf(0);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb).to.equal(null);
    expect(stateManager.get('service', service.name)).to.equal(null);
    expect(stateManager.get('serviceById', service.id)).to.equal(null);
    expect(externalIntegration.discoveredDevices.has(service.id)).to.equal(false);
  });

  it('should uninstall even when the container cannot be removed', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        removeContainer: fake.rejects(new Error('CANNOT_REMOVE')),
      },
    });
    externalIntegration.connections.set(service.id, {
      terminate: () => {
        throw new Error('CANNOT_TERMINATE');
      },
    });
    await externalIntegration.uninstall(service.selector);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb).to.equal(null);
  });

  it('should clear the camera rate-limit entries of the integration only', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.cameraImageRateLimits.set(`ext:${service.selector}:camera-1`, {
      count: 3,
      resetAt: Date.now() + 60 * 1000,
    });
    externalIntegration.cameraImageRateLimits.set('ext:ext-dev-other-integration:camera-1', {
      count: 1,
      resetAt: Date.now() + 60 * 1000,
    });
    await externalIntegration.uninstall(service.selector);
    expect(externalIntegration.cameraImageRateLimits.has(`ext:${service.selector}:camera-1`)).to.equal(false);
    expect(externalIntegration.cameraImageRateLimits.has('ext:ext-dev-other-integration:camera-1')).to.equal(true);
  });

  it('should throw on unknown integration', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.uninstall('ext-unknown');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }
  });

  it('should remove the sub-containers, their network and the data folder', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const rm = fake.resolves(undefined);
    const originalRm = fs.promises.rm;
    fs.promises.rm = rm;
    try {
      const { externalIntegration, system } = buildSupervisor({
        system: { getContainers: fake.resolves([{ id: 'sub-1' }]) },
      });
      await externalIntegration.uninstall(service.selector);
      expect(system.removeNetwork.calledWith('gladys-int-ext-dev-open-meteo-demo')).to.equal(true);
      expect(rm.firstCall.args[0]).to.equal('/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo');
      expect(rm.firstCall.args[1]).to.deep.equal({ recursive: true, force: true });
    } finally {
      fs.promises.rm = originalRm;
    }
  });

  it('should uninstall even when the sub-containers and data folder cannot be removed', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const originalRm = fs.promises.rm;
    fs.promises.rm = fake.rejects(new Error('EACCES'));
    try {
      const { externalIntegration } = buildSupervisor({
        system: {
          getContainers: fake.rejects(new Error('CANNOT_LIST')),
        },
      });
      await externalIntegration.uninstall(service.selector);
      const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
      expect(serviceInDb).to.equal(null);
    } finally {
      fs.promises.rm = originalRm;
    }
  });
});
