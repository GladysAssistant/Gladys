const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const SceneManager = proxyquire('../../../lib/scene', {
  suncalc: {
    getTimes: () => {
      return {
        sunrise: new Date(Date.now() + 60 * 60 * 1000),
        sunset: new Date(Date.now() + 60 * 60 * 1000),
      };
    },
  },
  'node-schedule': {
    scheduleJob: (date, callback) => {
      return {
        callback,
        date,
        cancel: () => {},
      };
    },
    RecurrenceRule: function RecurrenceRule() {},
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
  'node-schedule': {
    scheduleJob: (date, callback) => {
      return null;
    },
    RecurrenceRule: function RecurrenceRule() {},
  },
});

const house = {
  get: fake.resolves([
    {
      latitude: 12,
      longitude: 13,
    },
  ]),
};

const event = {
  on: fake.resolves(null),
  emit: fake.resolves(null),
};

const variable = {
  getValue: fake.resolves('UTC'),
};

describe('SceneManager.dailyUpdate', () => {
  let sceneManager;

  beforeEach(async () => {
    sceneManager = new SceneManager({}, event, {}, {}, variable, house);
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
    const sceneManagerPast = new SceneManagerWithPastSunriseSunset({}, event, {}, {}, variable, house);
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
