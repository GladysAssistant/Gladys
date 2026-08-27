const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { EVENTS } = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');
const SceneManager = require('../../../lib/scene');

describe('SceneManager.addScene', () => {
  const house = {};
  const event = {};
  const brain = {};
  const service = {};
  const mqttService = {
    device: {},
  };

  let sceneManager;

  beforeEach(() => {
    house.get = fake.resolves([]);
    event.on = fake.returns(null);
    event.emit = fake.returns(null);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    mqttService.device.subscribe = fake.returns(null);
    service.getService = fake.returns(mqttService);

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    sceneManager = new SceneManager({}, event, {}, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should NOT add a scene with an invalid trigger', async () => {
    try {
      await sceneManager.addScene({
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
    const scene = await sceneManager.addScene({
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
    const scene = await sceneManager.addScene({
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
    const scene = await sceneManager.addScene({
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
    const scene = await sceneManager.addScene({
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

    const scene = await sceneManager.addScene({
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
      await sceneManager.addScene({
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
      await sceneManager.addScene({
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
    sceneManager.dailyUpdate = fake.resolves(null);
    const scene = await sceneManager.addScene({
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
    assert.calledOnce(sceneManager.dailyUpdate);
  });
  it('should add a scene with a scheduled trigger, sunset', async () => {
    sceneManager.dailyUpdate = fake.resolves(null);
    const scene = await sceneManager.addScene({
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
    assert.calledOnce(sceneManager.dailyUpdate);
  });
  it('should NOT call dailyUpdate when adding a scene without sunrise/sunset triggers', async () => {
    sceneManager.dailyUpdate = fake.resolves(null);
    await sceneManager.addScene({
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
    assert.notCalled(sceneManager.dailyUpdate);
  });
  it('should NOT call dailyUpdate when skipDailyUpdate option is true, even with a sunrise trigger', async () => {
    sceneManager.dailyUpdate = fake.resolves(null);
    await sceneManager.addScene(
      {
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
      },
      { skipDailyUpdate: true },
    );
    assert.notCalled(sceneManager.dailyUpdate);
  });
  it('should call dailyUpdate when previous scene had sunrise trigger but new one does not', async () => {
    sceneManager.dailyUpdate = fake.resolves(null);
    const scene = await sceneManager.addScene({
      selector: 'my-scene',
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
    assert.calledOnce(sceneManager.dailyUpdate);
    sceneManager.dailyUpdate.resetHistory();
    // Update the scene to remove the sunrise trigger
    await sceneManager.addScene({
      selector: scene.selector,
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'every-day',
          time: '08:00',
        },
      ],
      actions: [],
    });
    assert.calledOnce(sceneManager.dailyUpdate);
  });
  it('should add a scene with a message received trigger', async () => {
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.not.have.property('nodeScheduleJob');
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.not.have.property('jsInterval');
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('mqttCallback');
    assert.calledWithExactly(service.getService, 'mqtt');
    assert.calledOnce(mqttService.device.subscribe);

    sceneManager.scenes[scene.selector].triggers[0].mqttCallback('my/topic', 'message');
    assert.calledOnceWithExactly(event.emit, EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.MQTT.RECEIVED,
      topic: 'my/topic',
      message: 'message',
    });
  });
  it('should add a scene with a time-range trigger, scheduling 2 jobs per range', async () => {
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          days_of_the_week: ['monday'],
          time_ranges: [
            { start: '12:00', end: '14:30' },
            { start: '16:00', end: '17:30' },
          ],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    expect(trigger).to.not.have.property('nodeScheduleJob');
    expect(trigger)
      .to.have.property('nodeScheduleJobs')
      .with.lengthOf(4);
    // start of the first range
    expect(trigger.nodeScheduleJobs[0].date).to.deep.equal({
      tz: 'Europe/Paris',
      dayOfWeek: [1],
      hour: 12,
      minute: 0,
      second: 0,
    });
    // end of the first range
    expect(trigger.nodeScheduleJobs[1].date).to.deep.equal({
      tz: 'Europe/Paris',
      dayOfWeek: [1],
      hour: 14,
      minute: 30,
      second: 0,
    });
  });

  it('should not schedule the end of a range when another one starts at the same time', async () => {
    // "10:00 -> 12:00" then "12:00 -> 14:00": at 12:00 the end job and the start job would
    // fire at the very same second, running the scene twice. Only the start is scheduled.
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          days_of_the_week: ['monday'],
          time_ranges: [
            { start: '10:00', end: '12:00' },
            { start: '12:00', end: '14:00' },
          ],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    expect(trigger)
      .to.have.property('nodeScheduleJobs')
      .with.lengthOf(3);
    expect(trigger.nodeScheduleJobs.map((job) => `${job.date.hour}:${job.date.minute}`)).to.deep.equal([
      '10:0',
      '12:0',
      '14:0',
    ]);
  });

  it('should still schedule the end of a range when the next one starts on other days', async () => {
    // The ranges touch at 12:00, but not on the same days: the end of the first one is the
    // only thing happening on monday at 12:00, so it must stay scheduled.
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          time_ranges: [
            { start: '10:00', end: '12:00', days_of_the_week: ['monday'] },
            { start: '12:00', end: '14:00', days_of_the_week: ['tuesday'] },
          ],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    expect(trigger)
      .to.have.property('nodeScheduleJobs')
      .with.lengthOf(4);
  });

  it('should keep the end of a range on the days the next one does not start on', async () => {
    // The ranges touch at 12:00, but the second one only starts on monday: on tuesday, the
    // end of the first one is the only thing happening at 12:00 and must stay scheduled,
    // while monday keeps the start only.
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          time_ranges: [
            { start: '10:00', end: '12:00', days_of_the_week: ['monday', 'tuesday'] },
            { start: '12:00', end: '14:00', days_of_the_week: ['monday'] },
          ],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    expect(trigger)
      .to.have.property('nodeScheduleJobs')
      .with.lengthOf(4);
    expect(
      trigger.nodeScheduleJobs.map((job) => ({
        time: `${job.date.hour}:${job.date.minute}`,
        dayOfWeek: job.date.dayOfWeek,
      })),
    ).to.deep.equal([
      // start of the first range
      { time: '10:0', dayOfWeek: [1, 2] },
      // its end, only on tuesday: monday is covered by the start of the second range
      { time: '12:0', dayOfWeek: [2] },
      // start of the second range
      { time: '12:0', dayOfWeek: [1] },
      // its end
      { time: '14:0', dayOfWeek: [1] },
    ]);
  });

  it('should keep the end of an overnight range when the next one starts on other days', async () => {
    // "22:00 -> 06:00" on monday ends on tuesday morning: only a range starting on TUESDAY at
    // 06:00 shares that boundary. The one configured on monday does not, so both are scheduled.
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          time_ranges: [
            { start: '22:00', end: '06:00', days_of_the_week: ['monday'] },
            { start: '06:00', end: '08:00', days_of_the_week: ['monday'] },
          ],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    expect(trigger)
      .to.have.property('nodeScheduleJobs')
      .with.lengthOf(4);
    // the end of the overnight range happens on tuesday, where nothing else starts
    expect(trigger.nodeScheduleJobs[1].date).to.deep.equal({
      tz: 'Europe/Paris',
      dayOfWeek: [2],
      hour: 6,
      minute: 0,
      second: 0,
    });
  });
  it('should schedule the end of an overnight range on the next day', async () => {
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          days_of_the_week: ['sunday', 'monday'],
          time_ranges: [{ start: '22:00', end: '06:00' }],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    expect(trigger.nodeScheduleJobs[0].date.dayOfWeek).to.deep.equal([0, 1]);
    // sunday -> monday, monday -> tuesday
    expect(trigger.nodeScheduleJobs[1].date.dayOfWeek).to.deep.equal([1, 2]);
  });
  it('should schedule every day when the trigger has no days_of_the_week', async () => {
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          time_ranges: [{ start: '12:00', end: '14:00' }],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    expect(trigger.nodeScheduleJobs[0].date.dayOfWeek).to.have.members([0, 1, 2, 3, 4, 5, 6]);
  });
  it('should NOT add a time-range trigger where every day was unselected', async () => {
    // An explicitly empty list is the user unselecting every day, which the editor warns
    // about: scheduling all seven days instead would be the exact opposite.
    try {
      await sceneManager.addScene({
        name: 'a-test-scene',
        icon: 'bell',
        active: true,
        triggers: [
          {
            type: EVENTS.TIME.CHANGED,
            scheduler_type: 'time-range',
            days_of_the_week: [],
            time_ranges: [{ start: '12:00', end: '14:00' }],
          },
        ],
        actions: [],
      });
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });
  it('should emit a check event with the range side when a job fires', async () => {
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          time_ranges: [{ start: '12:00', end: '14:00' }],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    trigger.nodeScheduleJobs[0].callback();
    assert.calledWith(
      event.emit,
      EVENTS.TRIGGERS.CHECK,
      sinon.match({ range_event: 'start', range_index: 0, key: trigger.key }),
    );
    trigger.nodeScheduleJobs[1].callback();
    assert.calledWith(event.emit, EVENTS.TRIGGERS.CHECK, sinon.match({ range_event: 'end', range_index: 0 }));
  });
  it('should not leak the scheduled jobs in the emitted event', async () => {
    const scene = await sceneManager.addScene({
      name: 'a-test-scene',
      icon: 'bell',
      active: true,
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          time_ranges: [{ start: '12:00', end: '14:00' }],
        },
      ],
      actions: [],
    });
    const [trigger] = sceneManager.scenes[scene.selector].triggers;
    trigger.nodeScheduleJobs[0].callback();
    // The event travels to the scope of the scene, where any action template can read it:
    // it must not carry the node-schedule jobs of the trigger.
    const emittedEvent = event.emit.lastCall.args[1];
    expect(emittedEvent).to.not.have.property('nodeScheduleJobs');
    expect(emittedEvent).to.not.have.property('time_ranges');
  });
  it('should NOT add a time-range trigger with an empty range', async () => {
    try {
      await sceneManager.addScene({
        name: 'a-test-scene',
        icon: 'bell',
        active: true,
        triggers: [
          {
            type: EVENTS.TIME.CHANGED,
            scheduler_type: 'time-range',
            time_ranges: [{ start: '12:00', end: '12:00' }],
          },
        ],
        actions: [],
      });
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });
});
