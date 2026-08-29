const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const Cinema = require('../../../lib/cinema');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const fakeMovies = [{ id: 1, title: 'A movie', releaseDate: '2026-06-15' }];

const options = {
  language: 'fr',
  region: 'FR',
  daysAhead: 30,
};

/**
 * @description Build a service manager mock over a map of services.
 * @param {object} services - Map of service name to service object.
 * @returns {object} The service manager mock.
 * @example
 * buildServiceManager({ tmdb: { movies: { getUpcoming: fake.resolves([]) } } });
 */
function buildServiceManager(services) {
  return {
    getService: (name) => (services[name] === undefined ? null : services[name]),
    stateManager: {
      getAllKeys: () => Object.keys(services),
    },
  };
}

describe('cinema.getUpcoming', () => {
  it('should get the upcoming movies from the only provider', async () => {
    const tmdb = {
      movies: { getUpcoming: fake.resolves(fakeMovies) },
    };
    const service = buildServiceManager({ tmdb });
    const cinema = new Cinema(service);
    const result = await cinema.getUpcoming(options);
    expect(result).to.deep.equal(fakeMovies);
    assert.calledWith(tmdb.movies.getUpcoming, options);
  });
  it('should skip services without the movies capability', async () => {
    const tmdb = {
      movies: { getUpcoming: fake.resolves(fakeMovies) },
    };
    const service = buildServiceManager({
      telegram: { message: { send: fake.resolves(null) } },
      'not-a-movie-service': {},
      tmdb,
    });
    const cinema = new Cinema(service);
    const result = await cinema.getUpcoming(options);
    expect(result).to.deep.equal(fakeMovies);
  });
  it('should try the next provider (alphabetical order) when the first one fails', async () => {
    const extTvdb = {
      movies: { getUpcoming: fake.rejects(new Error('REQUEST_TO_THIRD_PARTY_FAILED')) },
    };
    const tmdb = {
      movies: { getUpcoming: fake.resolves(fakeMovies) },
    };
    const service = buildServiceManager({ 'ext-tvdb': extTvdb, tmdb });
    const cinema = new Cinema(service);
    const result = await cinema.getUpcoming(options);
    expect(result).to.deep.equal(fakeMovies);
    assert.called(extTvdb.movies.getUpcoming);
  });
  it('should throw a service not configured error when there is no provider at all', async () => {
    const service = buildServiceManager({
      telegram: { message: { send: fake.resolves(null) } },
    });
    const cinema = new Cinema(service);
    const promise = cinema.getUpcoming(options);
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      },
    );
  });
  it('should throw a service not configured error when every provider is not configured', async () => {
    const tmdb = {
      movies: { getUpcoming: fake.rejects(new ServiceNotConfiguredError('TMDB API Key not found')) },
    };
    const service = buildServiceManager({ tmdb });
    const cinema = new Cinema(service);
    const promise = cinema.getUpcoming(options);
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      },
    );
  });
  it('should pin the provider chosen in the widget configuration', async () => {
    const extTvdb = {
      movies: { getUpcoming: fake.resolves([{ id: 2, title: 'Another movie' }]) },
    };
    const tmdb = {
      movies: { getUpcoming: fake.resolves(fakeMovies) },
    };
    const service = buildServiceManager({ 'ext-tvdb': extTvdb, tmdb });
    const cinema = new Cinema(service);
    // ext-tvdb wins although tmdb has precedence, because it's pinned
    const result = await cinema.getUpcoming({ ...options, service: 'ext-tvdb' });
    expect(result).to.deep.equal([{ id: 2, title: 'Another movie' }]);
    assert.notCalled(tmdb.movies.getUpcoming);
  });
  it('should surface the failure of a pinned provider instead of falling back', async () => {
    const realError = new Error('REQUEST_TO_THIRD_PARTY_FAILED');
    const extTvdb = {
      movies: { getUpcoming: fake.rejects(realError) },
    };
    const tmdb = {
      movies: { getUpcoming: fake.resolves(fakeMovies) },
    };
    const service = buildServiceManager({ 'ext-tvdb': extTvdb, tmdb });
    const cinema = new Cinema(service);
    const promise = cinema.getUpcoming({ ...options, service: 'ext-tvdb' });
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e.message).to.equal('REQUEST_TO_THIRD_PARTY_FAILED');
      },
    );
    assert.notCalled(tmdb.movies.getUpcoming);
  });
  it('should throw a service not configured error when the pinned provider is gone', async () => {
    const tmdb = {
      movies: { getUpcoming: fake.resolves(fakeMovies) },
    };
    const service = buildServiceManager({ tmdb });
    const cinema = new Cinema(service);
    const promise = cinema.getUpcoming({ ...options, service: 'ext-uninstalled-provider' });
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      },
    );
    assert.notCalled(tmdb.movies.getUpcoming);
  });
  it('should rethrow the first real failure over a not configured one', async () => {
    const realError = new Error('REQUEST_TO_THIRD_PARTY_FAILED');
    const extTvdb = {
      movies: { getUpcoming: fake.rejects(realError) },
    };
    const tmdb = {
      movies: { getUpcoming: fake.rejects(new ServiceNotConfiguredError('TMDB API Key not found')) },
    };
    const service = buildServiceManager({ 'ext-tvdb': extTvdb, tmdb });
    const cinema = new Cinema(service);
    const promise = cinema.getUpcoming(options);
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e.message).to.equal('REQUEST_TO_THIRD_PARTY_FAILED');
      },
    );
  });
});

describe('cinema.getProviders', () => {
  it('should list the movie providers in the precedence order of the loop', () => {
    const service = buildServiceManager({
      tmdb: { movies: { getUpcoming: fake.resolves([]) } },
      telegram: { message: { send: fake.resolves(null) } },
      'ext-tvdb': { movies: { getUpcoming: fake.resolves([]) } },
    });
    const cinema = new Cinema(service);
    expect(cinema.getProviders()).to.deep.equal(['ext-tvdb', 'tmdb']);
  });
});
