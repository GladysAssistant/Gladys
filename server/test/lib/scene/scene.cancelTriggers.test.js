const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { EVENTS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');

const { fake, assert } = sinon;

describe('SceneManager.cancelTriggers', () => {
  let sceneManager;

  const brain = {};
  const service = {};
  const event = {};
  const mqttService = {
    device: {},
  };

  beforeEach(() => {
    mqttService.device.unsubscribe = fake.returns(null);
    mqttService.device.subscribe = fake.returns(null);
    service.getService = fake.returns(mqttService);

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

    event.on = fake.returns(null);

    sceneManager = new SceneManager({}, event, {}, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should cancel a node-schedule trigger', async () => {
    const scene = await sceneManager.create({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'custom-time',
          date: '2100-01-01',
          time: '12:00',
        },
      ],
      actions: [],
      tags: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('nodeScheduleJob');
    sceneManager.cancelTriggers(scene.selector);
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJob');
  });
  it('should cancel every job of a time-range trigger', async () => {
    const cancelledJobs = [];
    sceneManager.scheduler.scheduleJob = (date, callback) => ({
      callback,
      date,
      cancel: () => cancelledJobs.push(date),
    });
    const scene = await sceneManager.create({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          time_ranges: [
            { start: '12:00', end: '14:30' },
            { start: '16:00', end: '17:30' },
          ],
        },
      ],
      actions: [],
      tags: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0])
      .to.have.property('nodeScheduleJobs')
      .with.lengthOf(4);
    sceneManager.cancelTriggers(scene.selector);
    // all four jobs must be cancelled, otherwise the scene keeps firing on its former ranges
    expect(cancelledJobs).to.have.lengthOf(4);
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJobs');
  });
  it('should cancel a js interval trigger', async () => {
    const scene = await sceneManager.create({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'interval',
          interval: 1000,
          unit: 'minute',
        },
      ],
      actions: [],
      tags: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJob');
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('jsInterval');
    sceneManager.cancelTriggers(scene.selector);
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('jsInterval');
  });
  it('should clear pending for_duration timers of this scene only', async () => {
    const thisSceneTimeout = setTimeout(() => {}, 60 * 1000);
    const otherSceneTimeout = setTimeout(() => {}, 60 * 1000);
    sceneManager.checkTriggersDurationTimer.set('device.new-state.a-test-scene.light-1:=:1', thisSceneTimeout);
    sceneManager.checkTriggersDurationTimer.set('device.new-state.another-scene.light-1:=:1', otherSceneTimeout);
    sceneManager.cancelTriggers('a-test-scene');
    expect(sceneManager.checkTriggersDurationTimer.has('device.new-state.a-test-scene.light-1:=:1')).to.equal(false);
    expect(sceneManager.checkTriggersDurationTimer.has('device.new-state.another-scene.light-1:=:1')).to.equal(true);
    clearTimeout(otherSceneTimeout);
    sceneManager.checkTriggersDurationTimer.clear();
  });
  it('should cancel a message received trigger', async () => {
    const scene = await sceneManager.create({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJob');
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('jsInterval');
    sceneManager.cancelTriggers(scene.selector);
    assert.calledWithExactly(service.getService, 'mqtt');
    assert.calledWithExactly(mqttService.device.unsubscribe, 'my/topic');
  });
});
