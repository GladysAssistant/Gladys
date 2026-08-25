const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { EVENTS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');

describe('SceneManager.resumeTimeRangeTriggers', () => {
  const event = {};
  const brain = {};
  const service = {};
  let sceneManager;

  const timeRangeTrigger = (options = {}) => ({
    type: EVENTS.TIME.CHANGED,
    scheduler_type: 'time-range',
    time_ranges: [{ start: '12:00', end: '14:30' }],
    ...options,
  });

  const addSceneToManager = (selector, { active = true, triggers = [] } = {}) => {
    sceneManager.scenes[selector] = { selector, name: selector, active, triggers };
  };

  beforeEach(() => {
    event.on = fake.returns(null);
    event.emit = fake.returns(null);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    service.getService = fake.returns(null);

    const scheduler = { scheduleJob: () => ({ cancel: () => {} }) };
    const house = { get: fake.resolves([]) };

    sceneManager = new SceneManager({}, event, {}, {}, {}, house, {}, {}, {}, scheduler, brain, service);
    sceneManager.scenes = {};
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should emit a resume event for a trigger asking for it', () => {
    addSceneToManager('pool', { triggers: [timeRangeTrigger({ resume_on_startup: true, key: 'trigger-key' })] });
    sceneManager.resumeTimeRangeTriggers();
    assert.calledOnceWithExactly(
      event.emit,
      EVENTS.TRIGGERS.CHECK,
      sinon.match({ range_event: 'resume', key: 'trigger-key', type: EVENTS.TIME.CHANGED }),
    );
  });

  it('should NOT emit anything when resume_on_startup is not enabled', () => {
    addSceneToManager('pool', { triggers: [timeRangeTrigger()] });
    sceneManager.resumeTimeRangeTriggers();
    assert.notCalled(event.emit);
  });

  it('should NOT emit anything for an inactive scene', () => {
    addSceneToManager('pool', { active: false, triggers: [timeRangeTrigger({ resume_on_startup: true })] });
    sceneManager.resumeTimeRangeTriggers();
    assert.notCalled(event.emit);
  });

  it('should ignore a trigger which is not a time-range one', () => {
    addSceneToManager('pool', {
      triggers: [{ type: EVENTS.TIME.CHANGED, scheduler_type: 'every-day', time: '09:00', resume_on_startup: true }],
    });
    sceneManager.resumeTimeRangeTriggers();
    assert.notCalled(event.emit);
  });

  it('should only resume once, even if init runs again on a timezone change', () => {
    addSceneToManager('pool', { triggers: [timeRangeTrigger({ resume_on_startup: true, key: 'trigger-key' })] });
    sceneManager.resumeTimeRangeTriggers();
    sceneManager.resumeTimeRangeTriggers();
    assert.calledOnce(event.emit);
  });

  it('should handle a scene without any trigger', () => {
    addSceneToManager('pool', { triggers: undefined });
    sceneManager.resumeTimeRangeTriggers();
    assert.notCalled(event.emit);
  });
});
