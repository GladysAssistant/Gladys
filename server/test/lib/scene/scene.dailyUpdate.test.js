const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;
const { EVENTS } = require('../../../utils/constants');

const SceneManager = proxyquire('../../../lib/scene', {
  suncalc: {
    getTimes: () => {
      return {
        sunrise: new Date(Date.now() + 60 * 60 * 1000),
        sunset: new Date(Date.now() + 60 * 60 * 1000),
      };
    },
  },
});

const SceneManagerWithPastSunriseSunset = proxyquire('../../../lib/scene', {
  suncalc: {
    getTimes: () => {
      return {
        sunrise: new Date(Date.now() - 60 * 60 * 1000),
        sunset: new Date(Date.now() - 60 * 60 * 1000),
      };
    },
  },
});

describe('SceneManager.dailyUpdate', () => {
  let sceneManager;

  const house = {};
  const event = {};
  const variable = {};
  const scheduler = {};
  const brain = {};

  beforeEach(async () => {
    house.get = fake.resolves([
      {
        selector: 'house-1',
        latitude: 12,
        longitude: 13,
      },
    ]);

    scheduler.scheduleJob = (date, callback) => {
      return {
        callback,
        date,
        cancel: () => {},
      };
    };
    event.on = fake.resolves(null);
    event.emit = fake.resolves(null);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    variable.getValue = fake.resolves('UTC');

    sceneManager = new SceneManager({}, event, {}, {}, variable, house, {}, {}, {}, scheduler, brain);
    await sceneManager.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should scheduleJob for sunrise/sunset for one house', async () => {
    await sceneManager.dailyUpdate();
    expect(sceneManager.jobs).to.have.lengthOf(2);

    // Simulate schedule function
    sceneManager.jobs.forEach((job) => {
      job.callback();
    });
    assert.called(event.emit);
  });

  it('should not scheduleJob for sunrise/sunset, sunset/sunrise is in the past', async () => {
    scheduler.scheduleJob = () => {
      return null;
    };
    const sceneManagerPast = new SceneManagerWithPastSunriseSunset(
      {},
      event,
      {},
      {},
      variable,
      house,
      {},
      {},
      {},
      scheduler,
    );
    await sceneManagerPast.dailyUpdate();
    expect(sceneManagerPast.jobs).to.deep.equal([]);
  });

  it("shouldn't scheduleJob for sunrise/sunset when house doesn't have location", async () => {
    house.get = fake.resolves([
      {
        latitude: null,
        longitude: null,
      },
    ]);
    await sceneManager.dailyUpdate();
    expect(sceneManager.jobs).to.have.lengthOf(0);
  });

  it("shouldn't scheduleJob for sunrise/sunset when no house", async () => {
    house.get = fake.resolves([]);
    await sceneManager.dailyUpdate();
    expect(sceneManager.jobs).to.have.lengthOf(0);
  });

  it('should schedule extra job for sunrise when a scene has offset=30', async () => {
    brain.addNamedEntity = fake.returns(null);
    sceneManager.addScene({
      selector: 'scene-offset',
      active: true,
      actions: [],
      triggers: [
        {
          type: EVENTS.TIME.SUNRISE,
          house: 'house-1',
          offset: 30,
        },
      ],
    });
    await sceneManager.dailyUpdate();
    // offset=0 sunrise + offset=30 sunrise + offset=0 sunset = 3 jobs
    expect(sceneManager.jobs).to.have.lengthOf(3);

    // Trigger all jobs and verify events are emitted with correct offsets
    const emittedOffsets = [];
    event.emit = (eventName, payload) => {
      emittedOffsets.push(payload.offset);
    };
    sceneManager.jobs.forEach((job) => {
      job.callback();
    });
    expect(emittedOffsets).to.include(0);
    expect(emittedOffsets).to.include(30);
  });

  it('should schedule extra job for sunset when a scene has negative offset=-15', async () => {
    brain.addNamedEntity = fake.returns(null);
    sceneManager.addScene({
      selector: 'scene-offset-neg',
      active: true,
      actions: [],
      triggers: [
        {
          type: EVENTS.TIME.SUNSET,
          house: 'house-1',
          offset: -15,
        },
      ],
    });
    await sceneManager.dailyUpdate();
    // offset=0 sunrise + offset=0 sunset + offset=-15 sunset = 3 jobs
    expect(sceneManager.jobs).to.have.lengthOf(3);

    const emittedOffsets = [];
    event.emit = (eventName, payload) => {
      emittedOffsets.push(payload.offset);
    };
    sceneManager.jobs.forEach((job) => {
      job.callback();
    });
    expect(emittedOffsets).to.include(0);
    expect(emittedOffsets).to.include(-15);
  });

  it('should not add extra jobs for an inactive scene with a sunrise trigger', async () => {
    brain.addNamedEntity = fake.returns(null);
    sceneManager.addScene({
      selector: 'scene-inactive',
      active: false,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNRISE, house: 'house-1', offset: 30 }],
    });
    await sceneManager.dailyUpdate();
    // Inactive scene offsets must be ignored: only offset=0 sunrise + offset=0 sunset = 2 jobs
    expect(sceneManager.jobs).to.have.lengthOf(2);
  });

  it('should not add extra jobs for a scene with no triggers', async () => {
    brain.addNamedEntity = fake.returns(null);
    sceneManager.addScene({
      selector: 'scene-no-triggers',
      active: true,
      actions: [],
      triggers: null,
    });
    await sceneManager.dailyUpdate();
    // Scene without triggers must be ignored: only offset=0 sunrise + offset=0 sunset = 2 jobs
    expect(sceneManager.jobs).to.have.lengthOf(2);
  });

  it('should deduplicate offsets when multiple scenes share the same offset', async () => {
    brain.addNamedEntity = fake.returns(null);
    sceneManager.addScene({
      selector: 'scene-a',
      active: true,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNRISE, house: 'house-1', offset: 30 }],
    });
    sceneManager.addScene({
      selector: 'scene-b',
      active: true,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNRISE, house: 'house-1', offset: 30 }],
    });
    await sceneManager.dailyUpdate();
    // offset=0 sunrise + offset=30 sunrise (deduplicated) + offset=0 sunset = 3 jobs
    expect(sceneManager.jobs).to.have.lengthOf(3);
  });
});
