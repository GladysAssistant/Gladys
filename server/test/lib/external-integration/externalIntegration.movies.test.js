const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { normalizeMovies } = require('../../../lib/external-integration/externalIntegration.normalizeMovies');
const { MOVIES_GET_UPCOMING_TIMEOUT_MS, MAX_MOVIES } = require('../../../lib/external-integration/constants');
const { buildSupervisor, seedExternalService, TEST_MOVIES_MANIFEST } = require('./testUtils.test');

const seedMoviesService = (overrides = {}) => seedExternalService({ manifest: TEST_MOVIES_MANIFEST, ...overrides });

const VALID_PAYLOAD = [
  {
    id: 42,
    title: 'A movie',
    releaseDate: '2026-08-01T00:00:00.000Z',
    overview: 'An overview.',
    posterUrl: 'https://example.com/poster.jpg',
    trailerUrl: 'https://example.com/trailer',
    sourceUrl: 'https://example.com/movie/42',
  },
];

describe('externalIntegration movies proxy capability', () => {
  it('should expose movies.getUpcoming on movies integrations only', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const moviesService = await seedMoviesService();
    externalIntegration.registerProxyService(moviesService);
    const moviesProxy = stateManager.get('service', moviesService.name);
    expect(moviesProxy.movies).to.be.an('object');
    expect(moviesProxy.movies.getUpcoming).to.be.a('function');
    const deviceService = await seedExternalService({
      name: 'ext-dev-device-demo',
      selector: 'ext-dev-device-demo',
    });
    externalIntegration.registerProxyService(deviceService);
    const deviceProxy = stateManager.get('service', deviceService.name);
    expect(deviceProxy.movies).to.equal(undefined);
  });

  it('should relay movies.getUpcoming over websocket and normalize the payload', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedMoviesService();
    externalIntegration.registerProxyService(service);
    externalIntegration.sendCommand = fake.resolves({ success: true, data: { movies: VALID_PAYLOAD } });
    const proxyService = stateManager.get('service', service.name);
    const movies = await proxyService.movies.getUpcoming({ language: 'fr', region: 'FR', daysAhead: 30 });
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MOVIES_GET_UPCOMING,
      {
        options: { language: 'fr', region: 'FR', daysAhead: 30 },
      },
      { timeoutMs: MOVIES_GET_UPCOMING_TIMEOUT_MS },
    );
    expect(movies).to.have.lengthOf(1);
    expect(movies[0].id).to.equal('42');
    expect(movies[0].title).to.equal('A movie');
    expect(movies[0].sourceUrl).to.equal('https://example.com/movie/42');
  });

  it('should fail on a command result without a movies payload', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedMoviesService();
    externalIntegration.registerProxyService(service);
    externalIntegration.sendCommand = fake.resolves({ success: true, data: {} });
    const proxyService = stateManager.get('service', service.name);
    await expect(proxyService.movies.getUpcoming({})).to.be.rejectedWith(ExternalIntegrationUnavailableError);
  });
});

describe('externalIntegration.normalizeMovies', () => {
  it('should normalize a full payload', () => {
    const movies = normalizeMovies(VALID_PAYLOAD);
    expect(movies).to.deep.equal([
      {
        id: '42',
        title: 'A movie',
        releaseDate: new Date('2026-08-01T00:00:00.000Z'),
        overview: 'An overview.',
        posterUrl: 'https://example.com/poster.jpg',
        trailerUrl: 'https://example.com/trailer',
        sourceUrl: 'https://example.com/movie/42',
      },
    ]);
  });

  it('should keep an entry with only the required fields', () => {
    const movies = normalizeMovies([{ id: 1, title: 'Minimal', releaseDate: '2026-08-01T00:00:00.000Z' }]);
    expect(movies).to.deep.equal([{ id: '1', title: 'Minimal', releaseDate: new Date('2026-08-01T00:00:00.000Z') }]);
  });

  it('should trim strings and drop unknown fields', () => {
    const movies = normalizeMovies([
      { id: 1, title: '  Padded  ', releaseDate: '2026-08-01T00:00:00.000Z', evilField: 'dropped' },
    ]);
    expect(movies[0].title).to.equal('Padded');
    expect(movies[0]).to.not.have.property('evilField');
  });

  it('should silently drop entries missing a required field, without rejecting the rest of the list', () => {
    const movies = normalizeMovies([
      { title: 'No id', releaseDate: '2026-08-01T00:00:00.000Z' },
      { id: 2, releaseDate: '2026-08-01T00:00:00.000Z' },
      { id: 3, title: 'No release date' },
      { id: 5, title: '   ', releaseDate: '2026-08-01T00:00:00.000Z' },
      { id: 6, title: 'Invalid release date', releaseDate: 'not-a-date' },
      { id: 4, title: 'Valid', releaseDate: '2026-08-01T00:00:00.000Z' },
      null,
      'not an object',
    ]);
    expect(movies).to.deep.equal([{ id: '4', title: 'Valid', releaseDate: new Date('2026-08-01T00:00:00.000Z') }]);
  });

  it('should cap the list at MAX_MOVIES entries', () => {
    const oversized = Array.from({ length: MAX_MOVIES + 10 }).map((value, index) => ({
      id: index,
      title: `Movie ${index}`,
      releaseDate: '2026-08-01T00:00:00.000Z',
    }));
    const movies = normalizeMovies(oversized);
    expect(movies).to.have.lengthOf(MAX_MOVIES);
  });

  it('should reject a payload that is not an array', () => {
    expect(() => normalizeMovies(null)).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeMovies('movies')).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeMovies({})).to.throw(ExternalIntegrationUnavailableError);
  });

  it('should drop a javascript: or data: URL instead of keeping it', () => {
    const movies = normalizeMovies([
      {
        id: 1,
        title: 'Malicious',
        releaseDate: '2026-08-01T00:00:00.000Z',
        // eslint-disable-next-line no-script-url -- deliberately testing that this scheme is rejected
        posterUrl: 'javascript:alert(1)',
        trailerUrl: 'data:text/html,<script>alert(1)</script>',
        sourceUrl: 'not a url at all',
      },
    ]);
    expect(movies[0]).to.deep.equal({
      id: '1',
      title: 'Malicious',
      releaseDate: new Date('2026-08-01T00:00:00.000Z'),
    });
  });

  it('should accept http (not only https) URLs', () => {
    const movies = normalizeMovies([
      { id: 1, title: 'Valid', releaseDate: '2026-08-01T00:00:00.000Z', posterUrl: 'http://example.com/poster.jpg' },
    ]);
    expect(movies[0].posterUrl).to.equal('http://example.com/poster.jpg');
  });

  it('should accept a finite numeric id and reject a non-finite one', () => {
    const movies = normalizeMovies([
      { id: 42, title: 'Finite', releaseDate: '2026-08-01T00:00:00.000Z' },
      { id: Infinity, title: 'Infinite', releaseDate: '2026-08-01T00:00:00.000Z' },
      { id: NaN, title: 'NaN', releaseDate: '2026-08-01T00:00:00.000Z' },
    ]);
    expect(movies).to.deep.equal([{ id: '42', title: 'Finite', releaseDate: new Date('2026-08-01T00:00:00.000Z') }]);
  });

  it('should reject an empty or oversized string id', () => {
    const movies = normalizeMovies([
      { id: '', title: 'Empty id', releaseDate: '2026-08-01T00:00:00.000Z' },
      { id: 'x'.repeat(201), title: 'Oversized id', releaseDate: '2026-08-01T00:00:00.000Z' },
      { id: 'valid-id', title: 'Valid', releaseDate: '2026-08-01T00:00:00.000Z' },
    ]);
    expect(movies).to.deep.equal([
      { id: 'valid-id', title: 'Valid', releaseDate: new Date('2026-08-01T00:00:00.000Z') },
    ]);
  });
});
