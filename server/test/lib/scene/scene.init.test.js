const { expect } = require('chai');
const sinon = require('sinon');
const SceneManager = require('../../../lib/scene');

const { fake, assert } = sinon;

describe('scene.init', () => {
  const event = {};
  const house = {};
  const scheduler = {};
  const brain = {};

  const variable = {};

  let sceneManager;
  beforeEach(() => {
    event.on = fake.returns(null);
    event.emit = fake.returns(null);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    house.get = fake.resolves([]);

    variable.getValue = fake.resolves(null);
    variable.setValue = fake.resolves(null);

    scheduler.scheduleJob = fake.returns(true);

    sceneManager = new SceneManager({}, event, {}, {}, variable, house, {}, {}, {}, scheduler, brain);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should init scene with default timezone', async () => {
    await sceneManager.init();
    expect(sceneManager.timezone).to.equal('Europe/Paris');
  });

  it('should init scene with timezone from variable', async () => {
    variable.getValue = () => Promise.resolve('Europe/London');
    variable.setValue = () => Promise.resolve(null);
    await sceneManager.init();
    expect(sceneManager.timezone).to.equal('Europe/London');
  });

  it('should init scene all scheduled task', async () => {
    await sceneManager.init();
    assert.callCount(scheduler.scheduleJob, 3);
    assert.calledWithMatch(
      scheduler.scheduleJob,
      { tz: 'Europe/Paris', hour: 0, minute: 0, second: 0 },
      sinon.match.func,
    );
    assert.calledWithMatch(scheduler.scheduleJob, '* * * * *', sinon.match.func);

    // Check that scheduled method send an event
    scheduler.scheduleJob.getCall(2).callback();
    assert.calledOnceWithExactly(event.emit, 'calendar.check-if-event-is-coming');
  });
});
