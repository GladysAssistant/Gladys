const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

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
});
