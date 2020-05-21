const { expect } = require('chai');
const EventEmitter = require('events');
const { EVENTS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager.cancelTriggers', () => {
  it('should cancel a node-schedule trigger', async () => {
    const sceneManager = new SceneManager({}, event);
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
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('nodeScheduleJob');
    sceneManager.cancelTriggers(scene.selector);
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJob');
  });
  it('should cancel a js interval trigger', async () => {
    const sceneManager = new SceneManager({}, event);
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
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJob');
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('jsInterval');
    sceneManager.cancelTriggers(scene.selector);
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('jsInterval');
  });
});
