const { expect } = require('chai');
const sinon = require('sinon');

const { promisify } = require('util');

const { fake, assert } = sinon;

const sleep = promisify(setTimeout);

const proxyquire = require('proxyquire').noCallThru();

const SceneManager = proxyquire('../../../lib/scene', {
  suncalc: {
    getTimes: () => {
      return {
        sunrise: new Date(Date.now()),
        sunset: new Date(Date.now()),
      };
    },
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
describe('SceneManager', () => {
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
    const jobs = await sceneManager.dailyUpdate();
    expect(jobs).to.have.lengthOf(2);

    await sleep(10);

    assert.called(event.emit);
  });

  it("shouldn't scheduleJob for sunrise/sunset", async () => {
    house.get = fake.resolves([]);
    const jobs = await sceneManager.dailyUpdate();
    expect(jobs).to.have.lengthOf(0);
  });
});
