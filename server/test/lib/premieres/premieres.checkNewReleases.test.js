const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Premieres = require('../../../lib/premieres');
const { EVENTS, SERVICE_TYPES } = require('../../../utils/constants');

/**
 * @description Build a Premieres instance backed by a fake service manager.
 * @param {object} getResultsByProvider - Map of provider name to an array
 * of successive poll results (a movies array, or an Error).
 * @returns {object} The instance plus its fake event emitter and services.
 * @example
 * buildPremieres({ tmdb: [[{ id: 1, title: 'A', releaseDate: '2026-01-01' }]] });
 */
function buildPremieres(getResultsByProvider) {
  const callIndex = {};
  const services = {};
  Object.keys(getResultsByProvider).forEach((providerName) => {
    callIndex[providerName] = -1;
    services[providerName] = {
      movies: {
        getUpcoming: fake(async () => {
          callIndex[providerName] += 1;
          const results = getResultsByProvider[providerName];
          const result = results[Math.min(callIndex[providerName], results.length - 1)];
          if (result instanceof Error) {
            throw result;
          }
          return result;
        }),
      },
    };
  });
  const service = {
    getService: (name) => services[name],
    stateManager: {
      getAllKeys: () => Object.keys(services),
    },
  };
  const event = { on: fake.returns(null), emit: fake.returns(null) };
  const premieres = new Premieres(service, event);
  return { premieres, event, services };
}

const triggerCheckCalls = (event) =>
  event.emit.getCalls().filter((callObject) => callObject.args[0] === EVENTS.TRIGGERS.CHECK);

describe('premieres.checkNewReleases', () => {
  let scene;
  // the bootstrap cleans and re-seeds the database between every test: the
  // listening scene must be re-created each time. The create also exercises
  // the new Joi trigger fields of the scene model.
  beforeEach(async () => {
    scene = await db.Scene.create({
      name: 'Movies new release scene test',
      icon: 'fe-film',
      active: true,
      triggers: [{ type: EVENTS.MOVIES.NEW_RELEASE }],
      actions: [[]],
    });
  });
  afterEach(() => {
    sinon.reset();
  });

  it('should not call any provider when no active scene listens to movies.new-release', async () => {
    await db.Scene.update({ active: false }, { where: { id: scene.id } });
    const { premieres, services } = buildPremieres({
      tmdb: [[{ id: 1, title: 'A', releaseDate: '2026-01-01' }]],
    });
    await premieres.checkNewReleases();
    expect(services.tmdb.movies.getUpcoming.callCount).to.equal(0);
  });

  it('should baseline on the first poll and fire on the second for a new movie id', async () => {
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const movieB = { id: 2, title: 'B', releaseDate: '2026-02-01' };
    const { premieres, event } = buildPremieres({ tmdb: [[movieA], [movieA, movieB]] });

    // poll 1: baseline, no events
    await premieres.checkNewReleases();
    expect(triggerCheckCalls(event)).to.have.lengthOf(0);

    // poll 2: movie B is new
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls).to.have.lengthOf(1);
    expect(calls[0].args[1].type).to.equal(EVENTS.MOVIES.NEW_RELEASE);
    expect(calls[0].args[1].service).to.equal('tmdb');
    expect(calls[0].args[1].movie.title).to.equal('B');
  });

  it('should populate the movie payload from the pivot fields, with a flattened showtimesText', async () => {
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const movieB = {
      id: 2,
      title: 'B',
      releaseDate: '2026-02-01',
      trailerUrl: 'https://example.com/trailer.mp4',
      sourceUrl: 'https://example.com/movie',
      showtimes: [
        { time: '14:00', version: 'VF' },
        { time: '16:35', version: 'VOST' },
      ],
    };
    const { premieres, event } = buildPremieres({ tmdb: [[movieA], [movieA, movieB]] });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls[0].args[1].movie).to.deep.equal({
      title: 'B',
      // no admin exists in this suite's fixtures: falls back to English
      releaseDate: 'February 1, 2026',
      sourceUrl: 'https://example.com/movie',
      trailerUrl: 'https://example.com/trailer.mp4',
      showtimesText: '14:00 VF, 16:35 VOST',
    });
  });

  it("should format the release date using the first admin's language", async () => {
    // the DB seeders already create admin users (english by default): switch
    // every one of them to French instead of adding a new admin, so the test
    // does not depend on which admin findOne happens to pick first
    await db.User.update({ language: 'fr' }, { where: { role: 'admin' } });
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const movieB = { id: 2, title: 'B', releaseDate: '2026-02-01' };
    const { premieres, event } = buildPremieres({ tmdb: [[movieA], [movieA, movieB]] });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls[0].args[1].movie.releaseDate).to.equal('1 février 2026');
  });

  it('should forward the resolved language to getUpcoming, so a TMDB-backed provider returns it', async () => {
    await db.User.update({ language: 'de' }, { where: { role: 'admin' } });
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const { premieres, services } = buildPremieres({ tmdb: [[movieA]] });
    await premieres.checkNewReleases();
    expect(services.tmdb.movies.getUpcoming.getCall(0).args[0]).to.deep.equal({ service: 'tmdb', language: 'de' });
  });

  it('should return the release date unchanged when it cannot be parsed', async () => {
    const movieA = { id: 1, title: 'A', releaseDate: 'not-a-date' };
    const movieB = { id: 2, title: 'B', releaseDate: 'still-not-a-date' };
    const { premieres, event } = buildPremieres({ tmdb: [[movieA], [movieA, movieB]] });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls[0].args[1].movie.releaseDate).to.equal('still-not-a-date');
  });

  it('should join a showtime with no version as the bare time', async () => {
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const movieB = {
      id: 2,
      title: 'B',
      releaseDate: '2026-02-01',
      showtimes: [{ time: '14:00' }, { time: '16:35', version: 'VOST' }],
    };
    const { premieres, event } = buildPremieres({ tmdb: [[movieA], [movieA, movieB]] });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls[0].args[1].movie.showtimesText).to.equal('14:00, 16:35 VOST');
  });

  it('should omit showtimesText (empty string) when the movie has no showtimes', async () => {
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const movieB = { id: 2, title: 'B', releaseDate: '2026-02-01' };
    const { premieres, event } = buildPremieres({ tmdb: [[movieA], [movieA, movieB]] });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls[0].args[1].movie.showtimesText).to.equal('');
  });

  it('should only poll the pinned provider when every active trigger pins the same one', async () => {
    await db.Scene.update(
      { triggers: [{ type: EVENTS.MOVIES.NEW_RELEASE, movies_provider: 'tmdb' }] },
      { where: { id: scene.id } },
    );
    const { premieres, services } = buildPremieres({
      tmdb: [[{ id: 1, title: 'A', releaseDate: '2026-01-01' }]],
      'ext-other': [[{ id: 9, title: 'X', releaseDate: '2026-01-01' }]],
    });
    await premieres.checkNewReleases();
    expect(services.tmdb.movies.getUpcoming.callCount).to.equal(1);
    expect(services['ext-other'].movies.getUpcoming.callCount).to.equal(0);
  });

  it('should call no provider when the only pinned provider is not registered', async () => {
    await db.Scene.update(
      { triggers: [{ type: EVENTS.MOVIES.NEW_RELEASE, movies_provider: 'not-installed' }] },
      { where: { id: scene.id } },
    );
    const { premieres, services } = buildPremieres({
      tmdb: [[{ id: 1, title: 'A', releaseDate: '2026-01-01' }]],
    });
    await premieres.checkNewReleases();
    expect(services.tmdb.movies.getUpcoming.callCount).to.equal(0);
  });

  it('should poll every provider as soon as one active trigger has no provider filter', async () => {
    await db.Scene.update(
      {
        triggers: [{ type: EVENTS.MOVIES.NEW_RELEASE, movies_provider: 'tmdb' }, { type: EVENTS.MOVIES.NEW_RELEASE }],
      },
      { where: { id: scene.id } },
    );
    const { premieres, services } = buildPremieres({
      tmdb: [[{ id: 1, title: 'A', releaseDate: '2026-01-01' }]],
      'ext-other': [[{ id: 9, title: 'X', releaseDate: '2026-01-01' }]],
    });
    await premieres.checkNewReleases();
    expect(services.tmdb.movies.getUpcoming.callCount).to.equal(1);
    expect(services['ext-other'].movies.getUpcoming.callCount).to.equal(1);
  });

  it('should not re-fire when a previously-seen movie falls off the provider list and later reappears', async () => {
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const movieB = { id: 2, title: 'B', releaseDate: '2026-02-01' };
    const { premieres, event } = buildPremieres({
      tmdb: [
        [movieA], // poll 1: baseline
        [movieA, movieB], // poll 2: B is new, fires once
        [movieA], // poll 3: B falls off the provider's single page
        [movieA, movieB], // poll 4: B reappears, must not re-fire
      ],
    });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls).to.have.lengthOf(1);
    expect(calls[0].args[1].movie.title).to.equal('B');
  });

  it('should keep the previous baseline when a provider fails', async () => {
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const { premieres, event, services } = buildPremieres({
      tmdb: [[movieA], new Error('provider down'), [movieA]],
    });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    expect(services.tmdb.movies.getUpcoming.callCount).to.equal(3);
    expect(triggerCheckCalls(event)).to.have.lengthOf(0);
  });

  it('should drop a check landing while another one is still in flight', async () => {
    let resolveInFlight;
    const inFlight = new Promise((resolve) => {
      resolveInFlight = resolve;
    });
    let call = 0;
    const tmdb = {
      movies: {
        getUpcoming: fake(() => {
          call += 1;
          return call === 1 ? Promise.resolve([{ id: 1, title: 'A', releaseDate: '2026-01-01' }]) : inFlight;
        }),
      },
    };
    const service = { getService: () => tmdb, stateManager: { getAllKeys: () => ['tmdb'] } };
    const event = { on: fake.returns(null), emit: fake.returns(null) };
    const premieres = new Premieres(service, event);

    // poll 1: baseline
    await premieres.checkNewReleases();

    // poll 2 hangs on the provider; poll 3 lands while it is in flight and
    // must be dropped immediately, without waiting for the provider
    const second = premieres.checkNewReleases();
    const third = premieres.checkNewReleases();
    await third;
    resolveInFlight([
      { id: 1, title: 'A', releaseDate: '2026-01-01' },
      { id: 2, title: 'B', releaseDate: '2026-02-01' },
    ]);
    await second;

    expect(tmdb.movies.getUpcoming.callCount).to.equal(2);
    const calls = triggerCheckCalls(event);
    expect(calls).to.have.lengthOf(1);
    expect(calls[0].args[1].movie.title).to.equal('B');
  });

  it("should resolve the provider's service label from its manifest", async () => {
    await db.Service.create({
      name: 'ext-ugc',
      selector: 'ext-ugc-selector',
      version: '0.1.0',
      type: SERVICE_TYPES.EXTERNAL,
      manifest: { name: 'UGC' },
    });
    await db.Scene.update(
      { triggers: [{ type: EVENTS.MOVIES.NEW_RELEASE, movies_provider: 'ext-ugc' }] },
      { where: { id: scene.id } },
    );
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const movieB = { id: 2, title: 'B', releaseDate: '2026-02-01' };
    const { premieres, event } = buildPremieres({ 'ext-ugc': [[movieA], [movieA, movieB]] });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls[0].args[1].serviceLabel).to.equal('UGC');
  });

  it('should fall back to the technical service name when there is no resolvable manifest label (e.g. tmdb)', async () => {
    const movieA = { id: 1, title: 'A', releaseDate: '2026-01-01' };
    const movieB = { id: 2, title: 'B', releaseDate: '2026-02-01' };
    const { premieres, event } = buildPremieres({ tmdb: [[movieA], [movieA, movieB]] });
    await premieres.checkNewReleases();
    await premieres.checkNewReleases();
    const calls = triggerCheckCalls(event);
    expect(calls[0].args[1].serviceLabel).to.equal('tmdb');
  });
});
