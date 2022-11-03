const { expect } = require('chai');
const sinon = require('sinon');
const SceneManager = require('../../../lib/scene');

const { fake, assert } = sinon;

describe('SceneManager.init', () => {
  const event = {};
  const house = {};
  const scheduler = {};

  const variable = {};

  let sceneManager;
  beforeEach(() => {
    event.on = fake.returns(null);
    event.emit = fake.returns(null);

    house.get = fake.resolves([]);

    variable.getValue = () => Promise.resolve(null);
    variable.setValue = () => Promise.resolve(null);

    scheduler.scheduleJob = fake.returns(true);

    sceneManager = new SceneManager({}, event, {}, {}, variable, house, {}, {}, {}, scheduler);
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
    assert.callCount(scheduler.scheduleJob, 2);
    assert.calledWithMatch(
      scheduler.scheduleJob,
      'scene-daily-update',
      { tz: 'Europe/Paris', hour: 0, minute: 0, second: 0 },
      sinon.match.func,
    );
    assert.calledWithMatch(scheduler.scheduleJob, 'calendar.check-if-event-is-coming', '* * * * *', sinon.match.func);

    // Check that scheduled method send an event
    scheduler.scheduleJob.getCall(1).callback();
    assert.calledOnceWithExactly(event.emit, 'calendar.check-if-event-is-coming');
  });
});
