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
    expect(integrations[0]).to.have.property('latest_version', null);
    expect(integrations[0]).to.have.property('update_requires_gladys_version', null);
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
    expect(integrations[0]).to.have.property('latest_version', '2.0.0');
    expect(integrations[0]).to.have.property('update_requires_gladys_version', null);
  });

  it('should not offer a version the running Gladys does not satisfy, and say what it requires', async () => {
    // the running Gladys is v4.82.0 (buildSupervisor): offered, this version
    // would be "updated" by re-pulling the current image, forever
    await seedExternalService({ store_slug: 'john/gladys-open-meteo-demo', version: '1.0.0' });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [
        {
          store_slug: 'john/gladys-open-meteo-demo',
          manifest: { ...TEST_MANIFEST, version: '2.0.0', gladys_version: '>=5.3.0' },
        },
      ],
    };
    const integrations = await externalIntegration.get();
    expect(integrations[0]).to.have.property('update_available', false);
    expect(integrations[0]).to.have.property('latest_version', '2.0.0');
    expect(integrations[0]).to.have.property('update_requires_gladys_version', '>=5.3.0');
  });
});

describe('externalIntegration.getLatestManifest', () => {
  it('should return the repo manifest when the index version is not semver', () => {
    const { externalIntegration } = buildSupervisor();
    const repoManifest = { ...TEST_MANIFEST, version: '1.5.0' };
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/demo', manifest: { ...TEST_MANIFEST, version: 'not-semver' } }],
    };
    externalIntegration.repoManifests.set('john/demo', repoManifest);
    expect(externalIntegration.getLatestManifest({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(repoManifest);
  });
});

describe('externalIntegration.getRequiredGladysVersion', () => {
  const buildWithLatest = (manifest) => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = { index_format: 1, integrations: [{ store_slug: 'john/demo', manifest }] };
    return externalIntegration;
  };

  it('should return the gladys_version of a newer version the running Gladys does not satisfy', () => {
    const externalIntegration = buildWithLatest({ ...TEST_MANIFEST, version: '2.0.0', gladys_version: '>=5.3.0' });
    expect(externalIntegration.getRequiredGladysVersion({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(
      '>=5.3.0',
    );
  });

  it('should return null when the running Gladys satisfies the newer version', () => {
    const externalIntegration = buildWithLatest({ ...TEST_MANIFEST, version: '2.0.0', gladys_version: '>=4.62.0' });
    expect(externalIntegration.getRequiredGladysVersion({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(null);
  });

  it('should return null when the latest known version is the installed one', () => {
    // nothing to update: the requirement of the installed version is moot
    const externalIntegration = buildWithLatest({ ...TEST_MANIFEST, version: '2.0.0', gladys_version: '>=5.3.0' });
    expect(externalIntegration.getRequiredGladysVersion({ store_slug: 'john/demo', version: '2.0.0' })).to.equal(null);
  });

  it('should return null when no latest version is known or the installed one is not semver', () => {
    const externalIntegration = buildWithLatest({ ...TEST_MANIFEST, version: '2.0.0', gladys_version: '>=5.3.0' });
    expect(externalIntegration.getRequiredGladysVersion({ store_slug: null, version: '1.0.0' })).to.equal(null);
    expect(externalIntegration.getRequiredGladysVersion({ store_slug: 'john/demo', version: 'dev' })).to.equal(null);
  });

  it('should return null when the running Gladys version is unknown', () => {
    const externalIntegration = buildWithLatest({ ...TEST_MANIFEST, version: '2.0.0', gladys_version: '>=5.3.0' });
    externalIntegration.system.gladysVersion = undefined;
    expect(externalIntegration.getRequiredGladysVersion({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(null);
  });
});

describe('externalIntegration.getLatestVersion', () => {
  it('should return null without store_slug (dev install)', () => {
    const { externalIntegration } = buildSupervisor();
    expect(externalIntegration.getLatestVersion({ store_slug: null, version: '1.0.0' })).to.equal(null);
  });

  it('should return null when the integration is unknown of the index', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/other', manifest: { ...TEST_MANIFEST, version: '2.0.0' } }],
    };
    expect(externalIntegration.getLatestVersion({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(null);
  });

  it('should return the index version', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/demo', manifest: { ...TEST_MANIFEST, version: '2.0.0' } }],
    };
    expect(externalIntegration.getLatestVersion({ store_slug: 'john/demo', version: '1.0.0' })).to.equal('2.0.0');
  });

  it('should return the repo manifest version when it is ahead of the index', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/demo', manifest: { ...TEST_MANIFEST, version: '2.0.0' } }],
    };
    externalIntegration.repoManifests.set('john/demo', { ...TEST_MANIFEST, version: '3.0.0' });
    expect(externalIntegration.getLatestVersion({ store_slug: 'john/demo', version: '1.0.0' })).to.equal('3.0.0');
  });

  it('should keep the index version when the repo manifest is older', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/demo', manifest: { ...TEST_MANIFEST, version: '3.0.0' } }],
    };
    externalIntegration.repoManifests.set('john/demo', { ...TEST_MANIFEST, version: '1.0.0' });
    expect(externalIntegration.getLatestVersion({ store_slug: 'john/demo', version: '2.0.0' })).to.equal('3.0.0');
  });

  it('should return null on an invalid version', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.repoManifests.set('john/demo', { ...TEST_MANIFEST, version: 'not-semver' });
    expect(externalIntegration.getLatestVersion({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(null);
  });

  it('should return null when the index entry carries no manifest', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = { index_format: 1, integrations: [{ store_slug: 'john/demo' }] };
    expect(externalIntegration.getLatestVersion({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(null);
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

  it('should prefer the repo manifest when it is ahead of the index', () => {
    // the index lags behind the repo by up to 1h30: once the repo manifest
    // has been read, its version is the one to compare against
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/demo', manifest: { ...TEST_MANIFEST, version: '2.0.0' } }],
    };
    externalIntegration.repoManifests.set('john/demo', { ...TEST_MANIFEST, version: '3.0.0' });
    expect(externalIntegration.isUpdateAvailable({ store_slug: 'john/demo', version: '2.0.0' })).to.equal(true);
    expect(externalIntegration.isUpdateAvailable({ store_slug: 'john/demo', version: '3.0.0' })).to.equal(false);
  });

  it('should keep the index version when the repo manifest is older', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.storeIndex = {
      index_format: 1,
      integrations: [{ store_slug: 'john/demo', manifest: { ...TEST_MANIFEST, version: '3.0.0' } }],
    };
    externalIntegration.repoManifests.set('john/demo', { ...TEST_MANIFEST, version: '1.0.0' });
    expect(externalIntegration.isUpdateAvailable({ store_slug: 'john/demo', version: '2.0.0' })).to.equal(true);
  });

  it('should return false on invalid versions', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.repoManifests.set('john/demo', { ...TEST_MANIFEST, version: 'not-semver' });
    expect(externalIntegration.isUpdateAvailable({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(false);
  });

  it('should return false when the newer version requires a Gladys the running one does not satisfy', () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.repoManifests.set('john/demo', {
      ...TEST_MANIFEST,
      version: '3.0.0',
      gladys_version: '>=5.3.0',
    });
    expect(externalIntegration.isUpdateAvailable({ store_slug: 'john/demo', version: '1.0.0' })).to.equal(false);
  });
});
