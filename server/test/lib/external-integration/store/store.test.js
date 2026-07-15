const { expect } = require('chai');
const nock = require('nock');
const { fake } = require('sinon');

const { NotFoundError, BadParameters, ConflictError } = require('../../../../utils/coreErrors');
const { Error422 } = require('../../../../utils/httpErrors');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('../testUtils.test');

const INDEX_URL_ORIGIN = 'https://integration-store-storage.gladysassistant.com';
const INDEX_URL_PATH = '/index.json';

const TEST_INDEX = {
  index_format: 1,
  generated_at: '2026-07-13T08:00:00.000Z',
  integrations: [
    {
      store_slug: 'john/gladys-open-meteo-demo',
      repo_url: 'https://github.com/john/gladys-open-meteo-demo',
      manifest: TEST_MANIFEST,
      cover_url: 'https://integration-store-storage.gladysassistant.com/covers/john--gladys-open-meteo-demo.jpg',
      github: { stars: 12, pushed_at: '2026-07-10T12:00:00.000Z' },
    },
    {
      store_slug: 'jane/gladys-incompatible',
      repo_url: 'https://github.com/jane/gladys-incompatible',
      manifest: { ...TEST_MANIFEST, name: 'Incompatible', gladys_version: '>=99.0.0' },
      cover_url: null,
      github: { stars: 1, pushed_at: '2026-07-01T12:00:00.000Z' },
    },
  ],
};

describe('externalIntegration store', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('refreshIndex', () => {
    it('should download, cache and persist the index', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration, variable } = buildSupervisor();
      const index = await externalIntegration.refreshIndex();
      expect(index.integrations).to.have.lengthOf(2);
      expect(externalIntegration.storeIndexFetchedAt).to.be.greaterThan(0);
      const cached = await variable.getValue('EXTERNAL_INTEGRATION_STORE_INDEX_CACHE');
      expect(JSON.parse(cached).index.integrations).to.have.lengthOf(2);
    });

    it('should reject an invalid index', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, { index_format: 99 });
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.refreshIndex();
        throw new Error('should have thrown');
      } catch (e) {
        expect(e.message).to.equal('INVALID_STORE_INDEX');
      }
    });

    it('should survive a manifest refresh failure of a not indexed install', async () => {
      await seedExternalService({ store_slug: 'bob/gladys-unreachable' });
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      externalIntegration.fetchManifestFromRepo = fake.rejects(new Error('offline'));
      const index = await externalIntegration.refreshIndex();
      expect(index.integrations).to.have.lengthOf(2);
      expect(externalIntegration.repoManifests.has('bob/gladys-unreachable')).to.equal(false);
    });

    it('should refresh the manifest of repo_url installs absent from the index', async () => {
      await seedExternalService({ store_slug: 'bob/gladys-not-indexed' });
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      externalIntegration.fetchManifestFromRepo = fake.resolves({ ...TEST_MANIFEST, version: '9.9.9' });
      await externalIntegration.refreshIndex();
      expect(externalIntegration.repoManifests.get('bob/gladys-not-indexed').version).to.equal('9.9.9');
    });
  });

  describe('getIndex', () => {
    it('should return the fresh in-memory index without network call', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = Date.now();
      const index = await externalIntegration.getIndex();
      expect(index).to.equal(TEST_INDEX);
    });

    it('should fall back on the stale memory copy when the network fails', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = 1;
      const index = await externalIntegration.getIndex();
      expect(index).to.equal(TEST_INDEX);
    });

    it('should fall back on the persistent cache when offline', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration, variable } = buildSupervisor();
      await variable.setValue(
        'EXTERNAL_INTEGRATION_STORE_INDEX_CACHE',
        JSON.stringify({ fetched_at: 12345, index: TEST_INDEX }),
      );
      const index = await externalIntegration.getIndex();
      expect(index.integrations).to.have.lengthOf(2);
      expect(externalIntegration.storeIndexFetchedAt).to.equal(12345);
    });

    it('should return null when no index was ever fetched', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration } = buildSupervisor();
      const index = await externalIntegration.getIndex();
      expect(index).to.equal(null);
    });

    it('should survive an invalid persistent cache', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration, variable } = buildSupervisor();
      await variable.setValue('EXTERNAL_INTEGRATION_STORE_INDEX_CACHE', '{invalid');
      const index = await externalIntegration.getIndex();
      expect(index).to.equal(null);
    });
  });

  describe('getCatalog', () => {
    it('should flag installed, update_available and compatible', async () => {
      await seedExternalService({
        store_slug: 'john/gladys-open-meteo-demo',
        version: '1.0.0',
        selector: 'ext-john-gladys-open-meteo-demo',
        name: 'ext-john-gladys-open-meteo-demo',
      });
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = Date.now();
      const catalog = await externalIntegration.getCatalog();
      expect(catalog.refreshed_at).to.be.a('string');
      expect(catalog.integrations).to.have.lengthOf(2);
      const demoEntry = catalog.integrations.find((entry) => entry.store_slug === 'john/gladys-open-meteo-demo');
      expect(demoEntry).to.include({
        installed: true,
        installed_selector: 'ext-john-gladys-open-meteo-demo',
        update_available: true,
        compatible: true,
      });
      const incompatibleEntry = catalog.integrations.find((entry) => entry.store_slug === 'jane/gladys-incompatible');
      expect(incompatibleEntry).to.include({ installed: false, compatible: false });
    });

    it('should treat a malformed gladys_version range as incompatible', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = {
        index_format: 1,
        integrations: [
          {
            store_slug: 'mallory/gladys-broken-range',
            manifest: { ...TEST_MANIFEST, gladys_version: 'not-a-range' },
          },
        ],
      };
      externalIntegration.storeIndexFetchedAt = Date.now();
      const catalog = await externalIntegration.getCatalog();
      expect(catalog.integrations[0]).to.have.property('compatible', false);
    });

    it('should filter with the search keyword', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = Date.now();
      const catalog = await externalIntegration.getCatalog({ search: 'meteo' });
      expect(catalog.integrations).to.have.lengthOf(1);
      expect(catalog.integrations[0].store_slug).to.equal('john/gladys-open-meteo-demo');
    });

    it('should return an empty catalog when no index is available', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration } = buildSupervisor();
      const catalog = await externalIntegration.getCatalog();
      expect(catalog.integrations).to.deep.equal([]);
      expect(catalog.refreshed_at).to.equal(null);
    });
  });

  describe('fetchManifestFromRepo', () => {
    it('should resolve the default branch and fetch the manifest', async () => {
      nock('https://api.github.com')
        .get('/repos/john/gladys-open-meteo-demo')
        .reply(200, { default_branch: 'main' });
      nock('https://raw.githubusercontent.com')
        .get('/john/gladys-open-meteo-demo/main/gladys-assistant-integration.json')
        .reply(200, JSON.stringify(TEST_MANIFEST));
      const { externalIntegration } = buildSupervisor();
      const manifest = await externalIntegration.fetchManifestFromRepo('john/gladys-open-meteo-demo');
      expect(manifest).to.deep.equal(TEST_MANIFEST);
    });

    it('should throw a 404 when the repo does not exist', async () => {
      nock('https://api.github.com')
        .get('/repos/john/unknown')
        .reply(404);
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.fetchManifestFromRepo('john/unknown');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(NotFoundError);
      }
    });

    it('should throw a 422 when the manifest file is absent', async () => {
      nock('https://api.github.com')
        .get('/repos/john/no-manifest')
        .reply(200, { default_branch: 'main' });
      nock('https://raw.githubusercontent.com')
        .get('/john/no-manifest/main/gladys-assistant-integration.json')
        .reply(404);
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.fetchManifestFromRepo('john/no-manifest');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        expect(e.properties).to.include('MANIFEST_NOT_FOUND');
      }
    });

    it('should throw a 422 when the manifest is not valid JSON', async () => {
      nock('https://api.github.com')
        .get('/repos/john/bad-json')
        .reply(200, { default_branch: 'main' });
      nock('https://raw.githubusercontent.com')
        .get('/john/bad-json/main/gladys-assistant-integration.json')
        .reply(200, '{invalid json');
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.fetchManifestFromRepo('john/bad-json');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        expect(e.properties).to.include('INVALID_MANIFEST');
      }
    });

    it('should rethrow non-404 errors of the GitHub API', async () => {
      nock('https://api.github.com')
        .get('/repos/john/rate-limited')
        .reply(500);
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.fetchManifestFromRepo('john/rate-limited');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e.message).to.include('500');
      }
    });

    it('should rethrow non-404 errors of the raw manifest fetch', async () => {
      nock('https://api.github.com')
        .get('/repos/john/raw-error')
        .reply(200, { default_branch: 'main' });
      nock('https://raw.githubusercontent.com')
        .get('/john/raw-error/main/gladys-assistant-integration.json')
        .reply(500);
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.fetchManifestFromRepo('john/raw-error');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e.message).to.include('500');
      }
    });

    it('should throw a 422 when the manifest is invalid', async () => {
      nock('https://api.github.com')
        .get('/repos/john/invalid-manifest')
        .reply(200, { default_branch: 'main' });
      nock('https://raw.githubusercontent.com')
        .get('/john/invalid-manifest/main/gladys-assistant-integration.json')
        .reply(200, JSON.stringify({ ...TEST_MANIFEST, version: 'nope' }));
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.fetchManifestFromRepo('john/invalid-manifest');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
      }
    });
  });

  describe('installFromStore', () => {
    it('should install an integration listed in the index', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = Date.now();
      const integration = await externalIntegration.installFromStore('john/gladys-open-meteo-demo');
      expect(integration).to.have.property('selector', 'ext-john-gladys-open-meteo-demo');
      expect(integration).to.have.property('store_slug', 'john/gladys-open-meteo-demo');
      externalIntegration.clearTimers(integration.id);
    });

    it('should throw a 404 on unknown store_slug', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = Date.now();
      try {
        await externalIntegration.installFromStore('unknown/slug');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(NotFoundError);
      }
    });

    it('should refuse to install twice', async () => {
      await seedExternalService({ store_slug: 'john/gladys-open-meteo-demo' });
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = Date.now();
      try {
        await externalIntegration.installFromStore('john/gladys-open-meteo-demo');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(ConflictError);
      }
    });
  });

  describe('installFromRepoUrl', () => {
    it('should install from a GitHub repo URL', async () => {
      nock('https://api.github.com')
        .get('/repos/john/gladys-open-meteo-demo')
        .reply(200, { default_branch: 'main' });
      nock('https://raw.githubusercontent.com')
        .get('/john/gladys-open-meteo-demo/main/gladys-assistant-integration.json')
        .reply(200, JSON.stringify(TEST_MANIFEST));
      const { externalIntegration } = buildSupervisor();
      const integration = await externalIntegration.installFromRepoUrl(
        'https://github.com/john/gladys-open-meteo-demo',
      );
      expect(integration).to.have.property('store_slug', 'john/gladys-open-meteo-demo');
      expect(externalIntegration.repoManifests.has('john/gladys-open-meteo-demo')).to.equal(true);
      externalIntegration.clearTimers(integration.id);
    });

    it('should reject a non-GitHub URL', async () => {
      const { externalIntegration } = buildSupervisor();
      const invalidUrls = ['https://gitlab.com/john/repo', 'not-a-url', null, 'https://github.com/john'];
      await Promise.all(
        invalidUrls.map(async (url) => {
          try {
            await externalIntegration.installFromRepoUrl(url);
            throw new Error('should have thrown');
          } catch (e) {
            expect(e).to.be.instanceOf(BadParameters);
          }
        }),
      );
    });
  });
});
