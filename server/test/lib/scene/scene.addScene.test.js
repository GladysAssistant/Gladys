const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const { EVENTS } = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager.addScene', () => {
  it('should add a scene with a scheduled trigger, every-month', async () => {
    const house = {
      get: fake.resolves([]),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house, {});
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
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
    const house = {
      get: fake.resolves([]),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house, {});
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
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
    const house = {
      get: fake.resolves([]),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house, {});
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
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
    const house = {
      get: fake.resolves([]),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house, {});
    const in30Minutes = new Date(new Date().getTime() + 30 * 60 * 1000);
    const date = in30Minutes.toISOString().slice(0, 10);
    const time = in30Minutes.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
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
    const house = {
      get: fake.resolves({
        latitude: 50,
        longitude: 50,
      }),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house, {});
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
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
    const house = {
      get: fake.resolves([]),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house, {});
    try {
      sceneManager.addScene({
        name: 'a-test-scene',
        icon: 'bell',
        active: true,
        triggers: [
          {
            type: EVENTS.TIME.CHANGED,
            scheduler_type: 'interval',
            interval: 10000,
            unit: 'hour',
          },
        ],
        actions: [],
      });
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('10000 hour is too big for an interval');
    }
  });
  it('should return error, interval not supported', async () => {
    const house = {
      get: fake.resolves([]),
    };
    const sceneManager = new SceneManager({}, event, {}, {}, {}, house, {});
    try {
      sceneManager.addScene({
        name: 'a-test-scene',
        icon: 'bell',
        active: true,
        triggers: [
          {
            type: EVENTS.TIME.CHANGED,
            scheduler_type: 'interval',
            interval: 10,
            unit: 'not-supported',
          },
        ],
        actions: [],
      });
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('not-supported not supported');
    }
  });
  it('should add a scene with a scheduled trigger, sunrise', async () => {
    const sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {});
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.SUNRISE,
          house: 'house',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.not.have.property('nodeScheduleJob');
  });
  it('should add a scene with a scheduled trigger, sunset', async () => {
    const sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {});
    const scene = sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.SUNSET,
          scheduler_type: 'sunset',
          house: 'house',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.not.have.property('nodeScheduleJob');
  });
});
