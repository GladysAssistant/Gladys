const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { useFakeTimers } = sinon;

// Pinned "now": 2026-06-01. Noon UTC avoids any date-only slicing edge case
// at the day boundary.
const NOW = Date.UTC(2026, 5, 1, 12, 0, 0);

const discoverResponse = {
  results: [
    // release_date here is TMDB's PRIMARY (worldwide) date, deliberately
    // wrong/irrelevant for 1001/1002/1003 to prove it gets overridden by the
    // regional lookup.
    {
      id: 1001,
      title: 'Comes Second',
      overview: 'discover fr 1001',
      release_date: '2010-01-01',
      poster_path: '/a.jpg',
    },
    { id: 1002, title: 'Comes First', overview: 'discover fr 1002', release_date: '2010-01-01', poster_path: '/b.jpg' },
    { id: 1003, title: 'Too Late', overview: 'discover fr 1003', release_date: '2010-01-01', poster_path: '/c.jpg' },
    // No FR entry in its release_dates response: falls back to this field.
    {
      id: 1004,
      title: 'Fallback In Window',
      overview: 'discover fr 1004',
      release_date: '2026-06-15',
      poster_path: null,
    },
    {
      id: 1005,
      title: 'Fallback Out Of Window',
      overview: 'discover fr 1005',
      release_date: '2019-04-24',
      poster_path: null,
    },
    // Deliberately empty at every step (discover included), to prove the
    // ultimate fallback chain never crashes when NO source has a summary.
    { id: 2002, title: 'No Overview Anywhere', overview: '', release_date: '2026-06-13', poster_path: null },
    { id: 2001, title: 'No French Overview', overview: '', release_date: '2026-06-12', poster_path: null },
    { id: 3001, title: 'French Trailer', overview: 'discover fr 3001', release_date: '2026-06-14', poster_path: null },
    {
      id: 3002,
      title: 'English Trailer Only',
      overview: 'discover fr 3002',
      release_date: '2026-06-16',
      poster_path: null,
    },
    {
      id: 3003,
      title: 'No Trailer Anywhere',
      overview: 'discover fr 3003',
      release_date: '2026-06-17',
      poster_path: null,
    },
  ],
};

// Keyed by `${movieId}:${language}`, the response of
// GET /movie/{id}?language=X&append_to_response=release_dates.
const detailsByIdAndLanguage = {
  '1001:fr-FR': {
    overview: 'fr overview 1001',
    release_dates: { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 3, release_date: '2026-06-20' }] }] },
  },
  '1002:fr-FR': {
    overview: 'fr overview 1002',
    release_dates: { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 2, release_date: '2026-06-10' }] }] },
  },
  '1003:fr-FR': {
    overview: 'fr overview 1003',
    release_dates: { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 3, release_date: '2026-08-01' }] }] },
  },
  '1004:fr-FR': {
    overview: 'fr overview 1004',
    release_dates: { results: [{ iso_3166_1: 'US', release_dates: [{ type: 3, release_date: '2026-06-15' }] }] },
  },
  '1005:fr-FR': { overview: 'fr overview 1005', release_dates: { results: [] } },
  // 2001 has no French overview: the service must retry with en-US.
  '2001:fr-FR': {
    overview: '',
    release_dates: { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 3, release_date: '2026-06-12' }] }] },
  },
  '2001:en-US': { overview: 'English summary for 2001', release_dates: { results: [] } },
  // 2002 has no overview in French NOR English: falls all the way back to
  // discover's own (also empty) overview instead of crashing.
  '2002:fr-FR': {
    overview: '',
    release_dates: { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 3, release_date: '2026-06-13' }] }] },
  },
  '2002:en-US': { overview: '', release_dates: { results: [] } },
  // 3001 has a French trailer: no fallback call needed for the trailer.
  '3001:fr-FR': {
    overview: 'fr overview 3001',
    release_dates: { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 3, release_date: '2026-06-14' }] }] },
    videos: { results: [{ site: 'YouTube', type: 'Trailer', official: true, key: 'fr-trailer-3001' }] },
  },
  // 3002 has a French overview (so overview alone would not trigger a
  // fallback call) but NO French trailer: the combined fallback must still
  // fire because the trailer is missing, and pick up the English one.
  '3002:fr-FR': {
    overview: 'fr overview 3002',
    release_dates: { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 3, release_date: '2026-06-16' }] }] },
    videos: { results: [] },
  },
  '3002:en-US': {
    overview: 'en overview 3002',
    release_dates: { results: [] },
    videos: { results: [{ site: 'YouTube', type: 'Trailer', official: true, key: 'en-trailer-3002' }] },
  },
  // 3003 has no trailer in French NOR English: trailerUrl ends up null.
  '3003:fr-FR': {
    overview: 'fr overview 3003',
    release_dates: { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 3, release_date: '2026-06-17' }] }] },
    videos: { results: [] },
  },
  '3003:en-US': { overview: 'en overview 3003', release_dates: { results: [] }, videos: { results: [] } },
};

const buildWorkingAxios = () => {
  const urls = [];
  const configs = [];
  return {
    axios: {
      default: {
        get: (url, config) => {
          urls.push(url);
          configs.push(config);
          if (url.includes('discover/movie')) {
            return Promise.resolve({ data: discoverResponse });
          }
          const [, movieId] = url.match(/\/movie\/(\d+)\?/) || [];
          const [, language] = url.match(/language=([\w-]+)/) || [];
          const details = detailsByIdAndLanguage[`${movieId}:${language}`];
          return Promise.resolve({ data: details || { overview: '', release_dates: { results: [] } } });
        },
      },
    },
    getUrls: () => urls,
    getConfigs: () => configs,
  };
};

const brokenAxios = {
  axios: {
    default: {
      get: () => Promise.reject(new Error('broken')),
    },
  },
};

const gladysConfigured = {
  variable: {
    getValue: () => Promise.resolve('TMDB_API_KEY_VALUE'),
  },
};

const gladysNotConfigured = {
  variable: {
    getValue: () => Promise.resolve(null),
  },
};

describe('TmdbService', () => {
  let clock;
  beforeEach(() => {
    clock = useFakeTimers(NOW);
  });
  afterEach(() => {
    clock.restore();
  });
  it('should start service', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
  });
  it('should not start service when TMDB API Key is not configured', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysNotConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    return assert.isRejected(tmdbService.start(), 'TMDB Service not configured');
  });
  it('should stop service', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.stop();
  });
  it('should return an error when the TMDB API Key is not configured', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysNotConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    return assert.isRejected(tmdbService.movies.getUpcoming(), 'TMDB API Key not found');
  });
  it('should return error, unable to contact third party provider', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', brokenAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    const promise = tmdbService.movies.getUpcoming();
    return assert.isRejected(promise, 'REQUEST_TO_THIRD_PARTY_FAILED');
  });
  it('should cache the result and not call the third-party API twice', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    const firstCallCount = (await tmdbService.movies.getUpcoming(), workingAxios.getUrls().length);
    await tmdbService.movies.getUpcoming();
    expect(workingAxios.getUrls().length).to.equal(firstCallCount);
  });
  it('should use a separate cache entry per days ahead window', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    await tmdbService.movies.getUpcoming({ daysAhead: 15 });
    const urlsAfterFirstCall = workingAxios.getUrls().length;
    await tmdbService.movies.getUpcoming({ daysAhead: 60 });
    expect(workingAxios.getUrls().length).to.be.greaterThan(urlsAfterFirstCall);
  });
  it('should resolve the actual regional release date, filter to the window and sort chronologically', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    const movies = await tmdbService.movies.getUpcoming({ daysAhead: 30, language: 'fr-FR' });
    expect(movies.map((movie) => ({ id: movie.id, releaseDate: movie.releaseDate }))).to.deep.equal([
      { id: 1002, releaseDate: '2026-06-10' },
      { id: 2001, releaseDate: '2026-06-12' },
      { id: 2002, releaseDate: '2026-06-13' },
      { id: 3001, releaseDate: '2026-06-14' },
      { id: 1004, releaseDate: '2026-06-15' },
      { id: 3002, releaseDate: '2026-06-16' },
      { id: 3003, releaseDate: '2026-06-17' },
      { id: 1001, releaseDate: '2026-06-20' },
    ]);
  });
  it('should keep the discover-provided date when a movie has no release_dates entry for the region', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    const movies = await tmdbService.movies.getUpcoming({ daysAhead: 30, language: 'fr-FR' });
    const fallbackMovie = movies.find((movie) => movie.id === 1004);
    expect(fallbackMovie.releaseDate).to.equal('2026-06-15');
  });
  it('should fall back to the English overview when the requested language has none', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    const movies = await tmdbService.movies.getUpcoming({ daysAhead: 30, language: 'fr-FR' });
    const movie = movies.find((m) => m.id === 2001);
    expect(movie.overview).to.equal('English summary for 2001');
  });
  it('should fall back to the discover overview when neither the requested nor English language has one', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    const movies = await tmdbService.movies.getUpcoming({ daysAhead: 30, language: 'fr-FR' });
    const movie = movies.find((m) => m.id === 2002);
    expect(movie.overview).to.equal('');
  });
  it('should default the language to English when none is given (TMDB is most complete in English)', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    await tmdbService.movies.getUpcoming({ daysAhead: 30 });
    const [discoverUrl] = workingAxios.getUrls().filter((url) => url.includes('discover/movie'));
    expect(discoverUrl).to.include('language=en-US');
  });
  it('should default the region to France when none is given', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    await tmdbService.movies.getUpcoming({ daysAhead: 30 });
    const [discoverUrl] = workingAxios.getUrls().filter((url) => url.includes('discover/movie'));
    expect(discoverUrl).to.include('region=FR');
  });
  it('should use the given region in the TMDB request and in the cache key', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    await tmdbService.movies.getUpcoming({ daysAhead: 30, region: 'US' });
    const [discoverUrl] = workingAxios.getUrls().filter((url) => url.includes('discover/movie'));
    expect(discoverUrl).to.include('region=US');
    const urlsAfterFirstCall = workingAxios.getUrls().length;
    // A different region is a cache miss, even with the same daysAhead.
    await tmdbService.movies.getUpcoming({ daysAhead: 30, region: 'FR' });
    expect(workingAxios.getUrls().length).to.be.greaterThan(urlsAfterFirstCall);
  });
  it('should ignore an invalid region and fall back to the default rather than forward it as-is', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    // Neither a 3-letter code nor a query-string injection attempt is a
    // valid ISO 3166-1 alpha-2 region: both must fall back to the default,
    // not leak into the cache key or the TMDB URL unchanged.
    await tmdbService.movies.getUpcoming({ daysAhead: 30, region: 'FRA' });
    await tmdbService.movies.getUpcoming({ daysAhead: 30, region: 'FR&evil=1' });
    const discoverUrls = workingAxios.getUrls().filter((url) => url.includes('discover/movie'));
    expect(discoverUrls).to.have.lengthOf(1);
    expect(discoverUrls[0]).to.include('region=FR');
  });
  it('should ignore a well-formed but unassigned region code (ZZ)', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    // 'ZZ' passes a bare 2-uppercase-letter regex but isn't a real ISO
    // 3166-1 region — the reserved "unknown territory" code.
    await tmdbService.movies.getUpcoming({ daysAhead: 30, region: 'ZZ' });
    const [discoverUrl] = workingAxios.getUrls().filter((url) => url.includes('discover/movie'));
    expect(discoverUrl).to.include('region=FR');
  });
  it('should send a finite timeout on every TMDB request', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    await tmdbService.movies.getUpcoming({ daysAhead: 30, language: 'fr-FR' });
    const configs = workingAxios.getConfigs();
    expect(configs.length).to.be.greaterThan(0);
    configs.forEach((config) => {
      expect(config)
        .to.have.property('timeout')
        .that.is.a('number')
        .and.is.greaterThan(0);
    });
  });
  it('should not request an English fallback when the requested language already is English', async () => {
    const workingAxios = buildWorkingAxios();
    const TmdbService = proxyquire('../../../services/tmdb/index', workingAxios);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    await tmdbService.movies.getUpcoming({ daysAhead: 30, language: 'en-US' });
    const movieDetailCalls = workingAxios.getUrls().filter((url) => url.includes('/movie/2001?'));
    expect(movieDetailCalls).to.have.lengthOf(1);
  });
  it('should not fail the whole request when a single movie details lookup fails', async () => {
    const workingAxios = buildWorkingAxios();
    const flaky = {
      axios: {
        default: {
          get: (url) => {
            if (url.includes('/movie/1001?')) {
              return Promise.reject(new Error('temporary failure'));
            }
            return workingAxios.axios.default.get(url);
          },
        },
      },
    };
    const TmdbService = proxyquire('../../../services/tmdb/index', flaky);
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    const movies = await tmdbService.movies.getUpcoming({ daysAhead: 30, language: 'fr-FR' });
    // 1001's details lookup failed: it falls back to its (out-of-window)
    // discover-provided date and is filtered out, but the request still succeeds.
    expect(movies.map((movie) => movie.id)).to.deep.equal([1002, 2001, 2002, 3001, 1004, 3002, 3003]);
  });
  it('should resolve a trailer, falling back to English only when the requested language has none', async () => {
    const TmdbService = proxyquire('../../../services/tmdb/index', buildWorkingAxios());
    const tmdbService = TmdbService(gladysConfigured, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await tmdbService.start();
    const movies = await tmdbService.movies.getUpcoming({ daysAhead: 30, language: 'fr-FR' });
    const findMovie = (id) => movies.find((movie) => movie.id === id);
    expect(findMovie(3001).trailerUrl).to.equal('https://www.youtube.com/watch?v=fr-trailer-3001');
    expect(findMovie(3002).trailerUrl).to.equal('https://www.youtube.com/watch?v=en-trailer-3002');
    expect(findMovie(3003).trailerUrl).to.equal(null);
  });
});
