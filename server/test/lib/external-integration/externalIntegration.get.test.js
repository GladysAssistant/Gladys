const { expect } = require('chai');

const { NotFoundError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.get', () => {
  it('should return only external integrations', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const integrations = await externalIntegration.get();
    expect(integrations).to.have.lengthOf(1);
    expect(integrations[0]).to.have.property('selector', service.selector);
    expect(integrations[0]).to.have.property('update_available', false);
  });

  it('should flag update_available from the store index', async () => {
    await seedExternalService({ store_slug: 'john/gladys-open-meteo-demo', version: '1.0.0' });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/gladys-open-meteo-demo', manifest: { ...TEST_MANIFEST, version: '2.0.0' } }],
    };
    const integrations = await externalIntegration.get();
    expect(integrations[0]).to.have.property('update_available', true);
  });
});

describe('externalIntegration.getBySelector', () => {
  it('should return the integration', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const integration = await externalIntegration.getBySelector(service.selector);
    expect(integration).to.have.property('id', service.id);
  });

  it('should throw on unknown selector', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.getBySelector('ext-unknown');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }
  });

  it('should not return internal services', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      // test-service is an internal service from the seeds
      await externalIntegration.getBySelector('test-service');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }
  });
});

describe('externalIntegration.isUpdateAvailable', () => {
  it('should return false without store_slug (dev install)', () => {
    const { externalIntegration } = buildSupervisor();
    expect(externalIntegration.isUpdateAvailable({ store_slug: null, version: '1.0.0' })).to.equal(false);
  });

  it('should use the repo manifest for repo_url installs absent from the index', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.repoManifests.set('john/demo', { ...TEST_MANIFEST, version: '3.0.0' });
    expect(externalIntegration.isUpdateAvailable({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(true);
    expect(externalIntegration.isUpdateAvailable({ store_slug: 'john/demo', version: '3.0.0' })).to.equal(false);
  });

  it('should return false on invalid versions', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.repoManifests.set('john/demo', { ...TEST_MANIFEST, version: 'not-semver' });
    expect(externalIntegration.isUpdateAvailable({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(false);
  });
});
