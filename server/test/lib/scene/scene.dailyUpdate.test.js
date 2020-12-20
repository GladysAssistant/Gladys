const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager', () => {
  it('should scheduleJob for sunrise/sunset for one house', async () => {
    const house = {
      get: fake.resolves([
        {
          latitude: 12,
          longitude: 13,
        },
      ]),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house);
    const jobs = await sceneManager.dailyUpdate();
    expect(jobs).to.have.lengthOf(2);
  });
  it("shouldn't scheduleJob for sunrise/sunset", async () => {
    const house = {
      get: fake.resolves([]),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house);
    const jobs = await sceneManager.dailyUpdate();
    expect(jobs).to.have.lengthOf(0);
  });
});
