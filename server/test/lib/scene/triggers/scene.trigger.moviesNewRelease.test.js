const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { triggersFunc } = require('../../../../lib/scene/scene.triggers');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

describe('Scene.triggers.moviesNewRelease', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  const service = {
    getService: fake.returns(null),
  };

  beforeEach(() => {
    const house = {
      get: fake.resolves([]),
    };

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    const stateManager = new StateManager();

    sceneManager = new SceneManager(stateManager, event, device, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  const buildEvent = (movie, providerService = 'tmdb') => ({
    type: EVENTS.MOVIES.NEW_RELEASE,
    service: providerService,
    serviceLabel: 'TMDB',
    movie,
  });

  it('should execute the scene when a new movie is detected', async () => {
    await sceneManager.addScene({
      selector: 'movies-new-release-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.MOVIES.NEW_RELEASE,
        },
      ],
    });
    sceneManager.checkTrigger(buildEvent({ title: 'Dune 3', releaseDate: '2026-01-01', showtimesText: '' }));
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledOnce(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should match by provider filter and title keyword, both optional', () => {
    const matcher = triggersFunc[EVENTS.MOVIES.NEW_RELEASE];
    const movie = { title: 'Dune: Part Three', releaseDate: '2026-01-01', showtimesText: '' };

    // no filter at all: matches anything
    expect(matcher(null, 'scene', buildEvent(movie), {})).to.equal(true);

    // provider filter: matching
    expect(matcher(null, 'scene', buildEvent(movie, 'gladys-ugc'), { movies_provider: 'gladys-ugc' })).to.equal(true);
    // provider filter: mismatch
    expect(matcher(null, 'scene', buildEvent(movie, 'gladys-cgr'), { movies_provider: 'gladys-ugc' })).to.equal(false);

    // keyword filter: matching, case-insensitive substring
    expect(matcher(null, 'scene', buildEvent(movie), { movies_title_keyword: 'dune' })).to.equal(true);
    // keyword filter: mismatch
    expect(matcher(null, 'scene', buildEvent(movie), { movies_title_keyword: 'avatar' })).to.equal(false);

    // both filters combined
    expect(
      matcher(null, 'scene', buildEvent(movie, 'gladys-ugc'), {
        movies_provider: 'gladys-ugc',
        movies_title_keyword: 'dune',
      }),
    ).to.equal(true);
    expect(
      matcher(null, 'scene', buildEvent(movie, 'gladys-cgr'), {
        movies_provider: 'gladys-ugc',
        movies_title_keyword: 'dune',
      }),
    ).to.equal(false);

    // an empty-string filter behaves like "absent" (the UI's "any" option)
    expect(matcher(null, 'scene', buildEvent(movie), { movies_provider: '', movies_title_keyword: '' })).to.equal(true);
  });

  it('should treat a movie with no title as a non-match rather than throw, when a keyword filter is set', () => {
    const matcher = triggersFunc[EVENTS.MOVIES.NEW_RELEASE];
    const movieWithNoTitle = { releaseDate: '2026-01-01', showtimesText: '' };

    expect(() => matcher(null, 'scene', buildEvent(movieWithNoTitle), { movies_title_keyword: 'dune' })).to.not.throw();
    expect(matcher(null, 'scene', buildEvent(movieWithNoTitle), { movies_title_keyword: 'dune' })).to.equal(false);
    // no keyword filter: still matches, title is irrelevant
    expect(matcher(null, 'scene', buildEvent(movieWithNoTitle), {})).to.equal(true);
  });
});
