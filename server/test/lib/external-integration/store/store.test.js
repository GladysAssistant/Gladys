const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { NotFoundError, BadParameters, ConflictError } = require('../../../../utils/coreErrors');
const { Error422 } = require('../../../../utils/httpErrors');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('../testUtils.test');
const { STORE_INDEX_TTL_MS } = require('../../../../lib/external-integration/store/store.constants');
const { getStoreIndexUrls } = require('../../../../lib/external-integration/store/store.downloadIndex');
const {
  buildCatalogEntry,
  coerceGladysVersion,
} = require('../../../../lib/external-integration/store/store.buildCatalogEntry');

const INDEX_URL_ORIGIN = 'https://integration-store-storage.gladysassistant.com';
const INDEX_URL_PATH = '/index.json';
const LITE_INDEX_URL_PATH = '/index-lite.json';

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
      docs: {
        en: 'https://integration-store-storage.gladysassistant.com/docs/john--gladys-open-meteo-demo/en.md',
        fr: 'https://integration-store-storage.gladysassistant.com/docs/john--gladys-open-meteo-demo/fr.md',
      },
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
    it('should download, cache and persist the lite index', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration, variable } = buildSupervisor();
      const index = await externalIntegration.refreshIndex();
      expect(index.integrations).to.have.lengthOf(2);
      expect(externalIntegration.storeIndexFetchedAt).to.be.greaterThan(0);
      const cached = await variable.getValue('EXTERNAL_INTEGRATION_STORE_INDEX_CACHE');
      expect(JSON.parse(cached).index.integrations).to.have.lengthOf(2);
    });

    it('should keep only the lite manifest fields of the downloaded index', async () => {
      // a fork without lite variant serves its full index as the lite one:
      // the heavy manifest fields must not reach memory, cache nor catalog
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration, variable } = buildSupervisor();
      const index = await externalIntegration.refreshIndex();
      const { config_schema: configSchema, cover_image: coverImage, ...liteManifest } = TEST_MANIFEST;
      expect(configSchema).to.be.an('array');
      expect(coverImage).to.be.a('string');
      expect(index.integrations[0].manifest).to.deep.equal(liteManifest);
      expect(index.integrations[0].docs).to.deep.equal(TEST_INDEX.integrations[0].docs);
      expect(index.integrations[0].github).to.deep.equal(TEST_INDEX.integrations[0].github);
      const cached = JSON.parse(await variable.getValue('EXTERNAL_INTEGRATION_STORE_INDEX_CACHE'));
      expect(cached.index.integrations[0].manifest).to.not.have.property('config_schema');
    });

    it('should tolerate an index entry without manifest', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
        .reply(200, { index_format: 1, integrations: [{ store_slug: 'mallory/no-manifest' }] });
      const { externalIntegration } = buildSupervisor();
      const index = await externalIntegration.refreshIndex();
      expect(index.integrations[0].manifest).to.deep.equal({});
    });

    it('should reject an invalid index', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
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
        .get(LITE_INDEX_URL_PATH)
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
        .get(LITE_INDEX_URL_PATH)
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

    it('should serve the memory copy right below the TTL, and re-download right above it', async () => {
      const { externalIntegration } = buildSupervisor();
      const refreshedIndex = { ...TEST_INDEX, generated_at: '2026-07-14T08:00:00.000Z' };
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.refreshIndex = fake(async () => {
        externalIntegration.storeIndex = refreshedIndex;
        externalIntegration.storeIndexFetchedAt = Date.now();
        return refreshedIndex;
      });

      externalIntegration.storeIndexFetchedAt = Date.now() - (STORE_INDEX_TTL_MS - 60 * 1000);
      expect(await externalIntegration.getIndex()).to.equal(TEST_INDEX);
      expect(externalIntegration.refreshIndex.called).to.equal(false);

      externalIntegration.storeIndexFetchedAt = Date.now() - (STORE_INDEX_TTL_MS + 60 * 1000);
      expect(await externalIntegration.getIndex()).to.equal(refreshedIndex);
      expect(externalIntegration.refreshIndex.called).to.equal(true);
    });

    it('should fall back on the stale memory copy when the network fails', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = 1;
      const index = await externalIntegration.getIndex();
      expect(index).to.equal(TEST_INDEX);
    });

    it('should fall back on the persistent cache when offline', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
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
        .get(LITE_INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration } = buildSupervisor();
      const index = await externalIntegration.getIndex();
      expect(index).to.equal(null);
    });

    it('should reduce a persistent cache holding the full index to the lite one', async () => {
      // the cache written before the lite index existed holds the full one
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration, variable } = buildSupervisor();
      await variable.setValue(
        'EXTERNAL_INTEGRATION_STORE_INDEX_CACHE',
        JSON.stringify({ fetched_at: 12345, index: TEST_INDEX }),
      );
      const index = await externalIntegration.getIndex();
      expect(index.integrations[0].manifest).to.not.have.property('config_schema');
      expect(index.integrations[0].manifest.name).to.equal(TEST_MANIFEST.name);
    });

    it('should ignore a persistent cache without integrations', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration, variable } = buildSupervisor();
      await variable.setValue('EXTERNAL_INTEGRATION_STORE_INDEX_CACHE', JSON.stringify({ fetched_at: 12345 }));
      const index = await externalIntegration.getIndex();
      expect(index).to.equal(null);
    });

    it('should survive an invalid persistent cache', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(LITE_INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration, variable } = buildSupervisor();
      await variable.setValue('EXTERNAL_INTEGRATION_STORE_INDEX_CACHE', '{invalid');
      const index = await externalIntegration.getIndex();
      expect(index).to.equal(null);
    });
  });

  describe('getDocsMarkdown', () => {
    const buildSupervisorWithIndex = () => {
      const built = buildSupervisor();
      built.externalIntegration.storeIndex = TEST_INDEX;
      built.externalIntegration.storeIndexFetchedAt = Date.now();
      return built;
    };

    it('should download the doc in the requested language', async () => {
      nock(INDEX_URL_ORIGIN)
        .get('/docs/john--gladys-open-meteo-demo/fr.md')
        .reply(200, '# Bonjour');
      const { externalIntegration } = buildSupervisorWithIndex();
      const docs = await externalIntegration.getDocsMarkdown('john/gladys-open-meteo-demo', 'fr');
      expect(docs).to.deep.equal({
        store_slug: 'john/gladys-open-meteo-demo',
        url: `${INDEX_URL_ORIGIN}/docs/john--gladys-open-meteo-demo/fr.md`,
        content: '# Bonjour',
      });
    });

    it('should fall back on the English doc for a language without doc', async () => {
      nock(INDEX_URL_ORIGIN)
        .get('/docs/john--gladys-open-meteo-demo/en.md')
        .reply(200, '# Hello');
      const { externalIntegration } = buildSupervisorWithIndex();
      const docs = await externalIntegration.getDocsMarkdown('john/gladys-open-meteo-demo', 'de');
      expect(docs.url).to.equal(`${INDEX_URL_ORIGIN}/docs/john--gladys-open-meteo-demo/en.md`);
      expect(docs.content).to.equal('# Hello');
    });

    it('should keep a JSON-looking doc as raw text', async () => {
      nock(INDEX_URL_ORIGIN)
        .get('/docs/john--gladys-open-meteo-demo/en.md')
        .reply(200, '{"not":"markdown"}');
      const { externalIntegration } = buildSupervisorWithIndex();
      const docs = await externalIntegration.getDocsMarkdown('john/gladys-open-meteo-demo');
      expect(docs.content).to.equal('{"not":"markdown"}');
    });

    it('should throw a NotFoundError for an integration without docs', async () => {
      const { externalIntegration } = buildSupervisorWithIndex();
      try {
        await externalIntegration.getDocsMarkdown('jane/gladys-incompatible', 'fr');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(NotFoundError);
        expect(e.message).to.equal('DOCS_NOT_FOUND');
      }
    });

    it('should throw a NotFoundError for an unknown integration', async () => {
      const { externalIntegration } = buildSupervisorWithIndex();
      try {
        await externalIntegration.getDocsMarkdown('nobody/gladys-unknown', 'fr');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(NotFoundError);
        expect(e.message).to.equal('DOCS_NOT_FOUND');
      }
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
      // the re-hosted docs urls flow through: the install screen and the
      // permanent Documentation link of the Configuration screen use them
      expect(demoEntry.docs).to.deep.equal(TEST_INDEX.integrations[0].docs);
      const incompatibleEntry = catalog.integrations.find((entry) => entry.store_slug === 'jane/gladys-incompatible');
      expect(incompatibleEntry).to.include({ installed: false, compatible: false });
      expect(incompatibleEntry.docs).to.equal(null);
    });

    it('should project the indexer categories, dropping unknown keys, and first_seen_at', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = {
        index_format: 1,
        integrations: [
          {
            store_slug: 'john/gladys-categorized',
            manifest: TEST_MANIFEST,
            // 'brand-new-shelf' comes from a newer vocabulary than this
            // instance: dropped from the projection, never a rejection
            categories: ['climate', 'brand-new-shelf', 'energy'],
            first_seen_at: '2026-08-01T00:00:00.000Z',
          },
          {
            store_slug: 'jane/gladys-uncategorized',
            manifest: TEST_MANIFEST,
          },
        ],
      };
      externalIntegration.storeIndexFetchedAt = Date.now();
      const catalog = await externalIntegration.getCatalog();
      expect(catalog.integrations[0].categories).to.deep.equal(['climate', 'energy']);
      expect(catalog.integrations[0].first_seen_at).to.equal('2026-08-01T00:00:00.000Z');
      expect(catalog.integrations[1].categories).to.deep.equal([]);
      expect(catalog.integrations[1].first_seen_at).to.equal(null);
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
        .get(LITE_INDEX_URL_PATH)
        .reply(500);
      const { externalIntegration } = buildSupervisor();
      const catalog = await externalIntegration.getCatalog();
      expect(catalog.integrations).to.deep.equal([]);
      expect(catalog.refreshed_at).to.equal(null);
    });
  });

  describe('refreshCatalog', () => {
    it('should report refreshed: true when the index was downloaded', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.refreshIndex = fake(async () => {
        externalIntegration.storeIndex = TEST_INDEX;
        externalIntegration.storeIndexFetchedAt = Date.now();
        return TEST_INDEX;
      });
      const catalog = await externalIntegration.refreshCatalog();
      expect(catalog.refreshed).to.equal(true);
      expect(catalog.integrations).to.have.lengthOf(2);
    });

    it('should report refreshed: false when the store is unreachable', async () => {
      // the call does not fail: the cached catalog comes back, so without
      // this flag the UI would announce a catalog that was never downloaded
      const { externalIntegration } = buildSupervisor();
      externalIntegration.storeIndex = TEST_INDEX;
      externalIntegration.storeIndexFetchedAt = 12345;
      externalIntegration.refreshIndex = fake.rejects(new Error('ENOTFOUND'));
      const catalog = await externalIntegration.refreshCatalog();
      expect(catalog.refreshed).to.equal(false);
      expect(catalog.integrations).to.have.lengthOf(2);
      expect(catalog.refreshed_at).to.equal(new Date(12345).toISOString());
    });

    it('should report refreshed: false when no index could ever be fetched', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.refreshIndex = fake.rejects(new Error('ENOTFOUND'));
      const catalog = await externalIntegration.refreshCatalog();
      expect(catalog.refreshed).to.equal(false);
      expect(catalog.integrations).to.deep.equal([]);
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

  describe('buildCatalogEntry', () => {
    it('should consider any valid range compatible when the Gladys version is unknown', () => {
      const entry = buildCatalogEntry(TEST_INDEX.integrations[1], undefined, null);
      expect(entry).to.include({ compatible: true, installed: false, installed_selector: null });
    });

    it('should coerce the Gladys version, or give null when it is unknown', () => {
      expect(coerceGladysVersion('v4.62.1')).to.equal('4.62.1');
      expect(coerceGladysVersion(undefined)).to.equal(null);
      expect(coerceGladysVersion('not-a-version')).to.equal(null);
    });
  });

  describe('getStoreIndexUrls', () => {
    const ENV_KEYS = ['EXTERNAL_INTEGRATION_STORE_INDEX_URL', 'EXTERNAL_INTEGRATION_STORE_INDEX_LITE_URL'];
    let savedEnv;

    beforeEach(() => {
      savedEnv = ENV_KEYS.map((key) => [key, process.env[key]]);
      ENV_KEYS.forEach((key) => delete process.env[key]);
    });

    afterEach(() => {
      savedEnv.forEach(([key, value]) => {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      });
    });

    it('should default to the official full and lite indexes', () => {
      expect(getStoreIndexUrls()).to.deep.equal({
        indexUrl: `${INDEX_URL_ORIGIN}${INDEX_URL_PATH}`,
        liteIndexUrl: `${INDEX_URL_ORIGIN}${LITE_INDEX_URL_PATH}`,
      });
    });

    it('should serve the catalog from an alternative full index without lite variant', () => {
      process.env.EXTERNAL_INTEGRATION_STORE_INDEX_URL = 'https://fork.example.com/index.json';
      expect(getStoreIndexUrls()).to.deep.equal({
        indexUrl: 'https://fork.example.com/index.json',
        liteIndexUrl: 'https://fork.example.com/index.json',
      });
    });

    it('should use the alternative lite index when set', () => {
      process.env.EXTERNAL_INTEGRATION_STORE_INDEX_URL = 'https://fork.example.com/index.json';
      process.env.EXTERNAL_INTEGRATION_STORE_INDEX_LITE_URL = 'https://fork.example.com/index-lite.json';
      expect(getStoreIndexUrls()).to.deep.equal({
        indexUrl: 'https://fork.example.com/index.json',
        liteIndexUrl: 'https://fork.example.com/index-lite.json',
      });
    });
  });

  describe('getStoreEntry', () => {
    it('should download the full index and return the complete entry', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      const entry = await externalIntegration.getStoreEntry('john/gladys-open-meteo-demo');
      expect(entry).to.deep.equal(TEST_INDEX.integrations[0]);
      expect(entry.manifest.config_schema).to.deep.equal(TEST_MANIFEST.config_schema);
    });

    it('should serve the last entry fetched from memory, until the TTL', async () => {
      // one download for the install page, none for the install click
      const scope = nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .once()
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      const first = await externalIntegration.getStoreEntry('john/gladys-open-meteo-demo');
      expect(scope.isDone()).to.equal(true);
      // the very same object: a new download would parse a new one
      expect(await externalIntegration.getStoreEntry('john/gladys-open-meteo-demo')).to.equal(first);

      externalIntegration.storeEntryCache.fetchedAt = Date.now() - (STORE_INDEX_TTL_MS + 60 * 1000);
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, {
          ...TEST_INDEX,
          integrations: [{ ...TEST_INDEX.integrations[0], manifest: { ...TEST_MANIFEST, version: '2.0.0' } }],
        });
      const refreshed = await externalIntegration.getStoreEntry('john/gladys-open-meteo-demo');
      expect(refreshed.manifest.version).to.equal('2.0.0');
    });

    it('should re-download for another integration or when asked to refresh', async () => {
      const { externalIntegration } = buildSupervisor();
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .times(3)
        .reply(200, TEST_INDEX);
      await externalIntegration.getStoreEntry('john/gladys-open-meteo-demo');
      const other = await externalIntegration.getStoreEntry('jane/gladys-incompatible');
      expect(other.manifest.name).to.equal('Incompatible');
      expect(externalIntegration.storeEntryCache.entry.store_slug).to.equal('jane/gladys-incompatible');
      await externalIntegration.getStoreEntry('jane/gladys-incompatible', { refresh: true });
      expect(nock.isDone()).to.equal(true);
    });

    it('should return null for an integration absent from the index, without caching anything', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      const entry = await externalIntegration.getStoreEntry('nobody/gladys-unknown');
      expect(entry).to.equal(null);
      expect(externalIntegration.storeEntryCache).to.equal(null);
    });

    it('should reject an invalid full index', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, { index_format: 99 });
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.getStoreEntry('john/gladys-open-meteo-demo');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e.message).to.equal('INVALID_STORE_INDEX');
      }
    });
  });

  describe('getStoreIntegration', () => {
    it('should return the catalog entry with the complete manifest and the flags', async () => {
      await seedExternalService({
        store_slug: 'john/gladys-open-meteo-demo',
        version: '1.0.0',
        selector: 'ext-john-gladys-open-meteo-demo',
        name: 'ext-john-gladys-open-meteo-demo',
      });
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      const integration = await externalIntegration.getStoreIntegration('john/gladys-open-meteo-demo');
      expect(integration.manifest).to.deep.equal(TEST_MANIFEST);
      expect(integration).to.include({
        store_slug: 'john/gladys-open-meteo-demo',
        installed: true,
        installed_selector: 'ext-john-gladys-open-meteo-demo',
        compatible: true,
      });
      expect(integration.docs).to.deep.equal(TEST_INDEX.integrations[0].docs);
    });

    it('should flag an incompatible integration not installed', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      const integration = await externalIntegration.getStoreIntegration('jane/gladys-incompatible');
      expect(integration).to.include({ installed: false, installed_selector: null, compatible: false });
    });

    it('should throw a NotFoundError for an integration absent from the index', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.getStoreIntegration('nobody/gladys-unknown');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(NotFoundError);
        expect(e.message).to.equal('INTEGRATION_NOT_FOUND_IN_STORE');
      }
    });
  });

  describe('installFromStore', () => {
    it('should install an integration listed in the index, with its complete manifest', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      const integration = await externalIntegration.installFromStore('john/gladys-open-meteo-demo');
      expect(integration).to.have.property('selector', 'ext-john-gladys-open-meteo-demo');
      expect(integration).to.have.property('store_slug', 'john/gladys-open-meteo-demo');
      expect(integration.manifest.config_schema).to.deep.equal(TEST_MANIFEST.config_schema);
      externalIntegration.clearTimers(integration.id);
    });

    it('should throw a 404 on unknown store_slug', async () => {
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
      try {
        await externalIntegration.installFromStore('unknown/slug');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(NotFoundError);
      }
    });

    it('should refuse to install twice', async () => {
      await seedExternalService({ store_slug: 'john/gladys-open-meteo-demo' });
      nock(INDEX_URL_ORIGIN)
        .get(INDEX_URL_PATH)
        .reply(200, TEST_INDEX);
      const { externalIntegration } = buildSupervisor();
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
