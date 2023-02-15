const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;
const { EVENTS } = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');
const SceneManager = require('../../../lib/scene');

describe('SceneManager.addScene', () => {
  const house = {};
  const event = {};
  const brain = {};

  let sceneManager;

  beforeEach(() => {
    house.get = fake.resolves([]);
    event.on = fake.returns(null);
    event.emit = fake.returns(null);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    sceneManager = new SceneManager({}, event, {}, {}, {}, house, {}, {}, {}, scheduler, brain);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should NOT add a scene with an invalid trigger', async () => {
    try {
      sceneManager.addScene({
        name: 'a-test-scene',
        icon: 'bell',
        active: true,
        triggers: [
          {
            type: EVENTS.TIME.CHANGED,
            scheduler_type: 'bad-trigger',
            day_of_the_month: 1,
            time: '12:00',
          },
        ],
        actions: [],
      });
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });
  it('should add a scene with a scheduled trigger, every-month', async () => {
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

    const trigger = sceneManager.scenes[scene.selector].triggers[0];
    expect(trigger).to.have.property('nodeScheduleJob');

    // Check scheduled job run
    trigger.nodeScheduleJob.callback();
    assert.calledOnceWithExactly(event.emit, EVENTS.TRIGGERS.CHECK, trigger);
  });
  it('should add a scene with a scheduled trigger, every-week', async () => {
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
    house.get = fake.resolves({
      latitude: 50,
      longitude: 50,
    });

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
