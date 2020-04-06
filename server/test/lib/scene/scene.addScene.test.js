const { expect } = require('chai');
const EventEmitter = require('events');
const { EVENTS } = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager.addScene', () => {
  it('should add a scene with a scheduled trigger, every-month', async () => {
    const sceneManager = new SceneManager({}, event);
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'every-month',
          day_of_the_month: 1,
          time: '12:00',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('nodeScheduleJob');
  });
  it('should add a scene with a scheduled trigger, every-week', async () => {
    const sceneManager = new SceneManager({}, event);
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'every-week',
          days_of_the_week: ['monday'],
          time: '12:00',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('nodeScheduleJob');
  });
  it('should add a scene with a scheduled trigger, every-day', async () => {
    const sceneManager = new SceneManager({}, event);
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'every-day',
          time: '12:00',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('nodeScheduleJob');
  });
  it('should add a scene with a scheduled trigger, custom-time', async () => {
    const sceneManager = new SceneManager({}, event);
    const in30Minutes = new Date(new Date().getTime() + 30 * 60 * 1000);
    const date = in30Minutes.toISOString().slice(0, 10);
    const time = in30Minutes.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'custom-time',
          date,
          time,
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('nodeScheduleJob');
  });
  it('should add a scene with a scheduled trigger, interval', async () => {
    const sceneManager = new SceneManager({}, event);
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'interval',
          interval: 10,
          unit: 'hour',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('jsInterval');
  });
  it('should throw an error, interval is too big', async () => {
    const sceneManager = new SceneManager({}, event);
    expect(() =>
      sceneManager.addScene({
        name: 'a-test-scene',
        icon: 'bell',
        triggers: [
          {
            type: EVENTS.TIME.CHANGED,
            scheduler_type: 'interval',
            interval: 10000,
            unit: 'hour',
          },
        ],
        actions: [],
      }),
    ).to.throw(BadParameters, '10000 hour is too big for an interval');
  });
  it('should return error, interval not supported', async () => {
    const sceneManager = new SceneManager({}, event);
    expect(() =>
      sceneManager.addScene({
        name: 'a-test-scene',
        icon: 'bell',
        triggers: [
          {
            type: EVENTS.TIME.CHANGED,
            scheduler_type: 'interval',
            interval: 10,
            unit: 'not-supported',
          },
        ],
        actions: [],
      }),
    ).to.throw(BadParameters, 'not-supported not supported');
  });
});
