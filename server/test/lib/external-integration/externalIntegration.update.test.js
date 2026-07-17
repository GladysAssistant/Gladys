const { expect } = require('chai');
const sinon = require('sinon');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { BadParameters, PlatformNotCompatible } = require('../../../utils/coreErrors');
const { SERVICE_STATUS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_MANIFEST, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.update', () => {
  it('should update from the store index and rotate the token', async () => {
    const service = await seedExternalService({
      store_slug: 'john/gladys-open-meteo-demo',
      version: '1.2.0',
      token_version: 1,
    });
    const newManifest = { ...TEST_MANIFEST, version: '2.0.0', docker_image: 'ghcr.io/john/demo:2.0.0' };
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/gladys-open-meteo-demo', manifest: newManifest }],
    };
    externalIntegration.storeIndexFetchedAt = Date.now();
    const integration = await externalIntegration.update(service.selector);
    expect(integration).to.have.property('version', '2.0.0');
    expect(integration).to.have.property('docker_image', 'ghcr.io/john/demo:2.0.0');
    expect(integration.manifest.version).to.equal('2.0.0');
    // container recreated: old token invalidated
    expect(integration.token_version).to.equal(2);
    sinonAssert.calledWith(system.pull, 'ghcr.io/john/demo:2.0.0');
    sinonAssert.calledWith(system.removeContainer, 'container-1', { force: true });
    expect(integration.status).to.equal(SERVICE_STATUS.LOADING);
    externalIntegration.clearTimers(service.id);
  });

  it('should re-pull the current image for dev installs', async () => {
    const service = await seedExternalService({ store_slug: null });
    const { externalIntegration, system } = buildSupervisor();
    await externalIntegration.update(service.selector);
    sinonAssert.calledWith(system.pull, TEST_MANIFEST.docker_image);
    externalIntegration.clearTimers(service.id);
  });

  it('should fetch the manifest directly from the repo when absent from the index', async () => {
    const service = await seedExternalService({ store_slug: 'john/gladys-open-meteo-demo' });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.getIndex = fake.resolves(null);
    externalIntegration.fetchManifestFromRepo = fake.resolves({ ...TEST_MANIFEST, version: '3.0.0' });
    const integration = await externalIntegration.update(service.selector);
    expect(integration.version).to.equal('3.0.0');
    externalIntegration.clearTimers(service.id);
  });

  it('should fall back to the stored manifest when the repo is unreachable', async () => {
    const service = await seedExternalService({ store_slug: 'john/gladys-open-meteo-demo' });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.getIndex = fake.resolves(null);
    externalIntegration.fetchManifestFromRepo = fake.rejects(new Error('offline'));
    const integration = await externalIntegration.update(service.selector);
    expect(integration.version).to.equal('1.2.0');
    externalIntegration.clearTimers(service.id);
  });

  it('should keep updating when the old container cannot be stopped', async () => {
    const service = await seedExternalService({ store_slug: null });
    const { externalIntegration } = buildSupervisor({
      system: {
        stopContainer: fake.rejects(new Error('CANNOT_STOP')),
      },
    });
    const integration = await externalIntegration.update(service.selector);
    expect(integration.version).to.equal('1.2.0');
    externalIntegration.clearTimers(service.id);
  });

  it('should throw an explicit error when the new image cannot be pulled', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        pull: fake.rejects(new Error('no matching manifest')),
      },
    });
    try {
      await externalIntegration.update(service.selector);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('UNABLE_TO_PULL_IMAGE');
    }
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.version).to.equal('1.2.0');
  });

  it('should throw when Docker is not available', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.available = false;
    try {
      await externalIntegration.update(service.selector);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should pull the sub-container images and remove the old sub-containers, keeping the network', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration, system } = buildSupervisor({
      system: { getContainers: fake.resolves([{ id: 'sub-1' }]) },
    });
    await externalIntegration.update(service.selector);
    sinonAssert.calledWith(system.pull, 'eclipse-mosquitto:2.0.18');
    sinonAssert.calledWith(system.pull, 'ghcr.io/blakeblackshear/frigate:0.14.1');
    sinonAssert.calledWith(system.removeContainer, 'sub-1', { force: true });
    sinonAssert.notCalled(system.removeNetwork);
  });

  it('should translate a failing sub-container image pull on update', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const pullStub = sinon.stub();
    pullStub.withArgs('eclipse-mosquitto:2.0.18').rejects(new Error('NO_MATCHING_MANIFEST'));
    pullStub.resolves(true);
    const { externalIntegration } = buildSupervisor({ system: { pull: pullStub } });
    try {
      await externalIntegration.update(service.selector);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('UNABLE_TO_PULL_IMAGE');
    }
  });
});
