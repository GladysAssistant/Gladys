const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const { fake, assert } = sinon;
const { EVENTS } = require('../../../utils/constants');

const SceneManager = proxyquire('../../../lib/scene', {
  suncalc: {
    getTimes: () => {
      return {
        sunrise: new Date(Date.now() + 60 * 60 * 1000),
        sunset: new Date(Date.now() + 60 * 60 * 1000),
      };
    },
  },
});

// SceneManager whose suncalc always returns past times (scheduler returns null = no job)
const SceneManagerWithPastSunriseSunset = proxyquire('../../../lib/scene', {
  suncalc: {
    getTimes: () => {
      return {
        sunrise: new Date(Date.now() - 60 * 60 * 1000),
        sunset: new Date(Date.now() - 60 * 60 * 1000),
      };
    },
  },
});

// SceneManager whose suncalc records the date argument passed to getTimes
let capturedTodayAt12 = null;
const SceneManagerCaptureTodayAt12 = proxyquire('../../../lib/scene', {
  suncalc: {
    getTimes: (date) => {
      capturedTodayAt12 = date;
      return {
        sunrise: new Date(Date.now() + 60 * 60 * 1000),
        sunset: new Date(Date.now() + 60 * 60 * 1000),
      };
    },
  },
});

describe('SceneManager.dailyUpdate', () => {
  let sceneManager;

  const house = {};
  const event = {};
  const variable = {};
  const scheduler = {};
  const brain = {};

  beforeEach(async () => {
    house.get = fake.resolves([
      {
        selector: 'house-1',
        latitude: 12,
        longitude: 13,
      },
    ]);

    scheduler.scheduleJob = (date, callback) => {
      return {
        callback,
        date,
        cancel: () => {},
      };
    };
    event.on = fake.resolves(null);
    event.emit = fake.resolves(null);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    variable.getValue = fake.resolves('UTC');

    sceneManager = new SceneManager({}, event, {}, {}, variable, house, {}, {}, {}, scheduler, brain);
    await sceneManager.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should scheduleJob for sunrise/sunset for one house', async () => {
    await sceneManager.dailyUpdate();
    expect(sceneManager.jobs).to.have.lengthOf(2);

    // Simulate schedule function
    sceneManager.jobs.forEach((job) => {
      job.callback();
    });
    assert.called(event.emit);
  });

  it('should not scheduleJob for sunrise/sunset, sunset/sunrise is in the past', async () => {
    scheduler.scheduleJob = () => {
      return null;
    };
    const sceneManagerPast = new SceneManagerWithPastSunriseSunset(
      {},
      event,
      {},
      {},
      variable,
      house,
      {},
      {},
      {},
      scheduler,
      brain,
    );
    await sceneManagerPast.dailyUpdate();
    expect(sceneManagerPast.jobs).to.deep.equal([]);
  });

  it('should compute todayAt12 in the user timezone, not in server UTC', async () => {
    // Root-cause regression test: when the server clock is UTC and the user timezone
    // is Europe/Paris (UTC+2), dailyUpdate used to call dayjs().hour(12).tz(tz) which
    // only converts the display zone *after* setting hours in UTC — yielding the wrong
    // calendar day at midnight Paris time (= 22:00 UTC of the previous day).
    // The correct form is dayjs().tz(tz).hour(12) which first converts to Paris time
    // then sets the hour, so getTimes() always receives noon of the current Paris day.
    capturedTodayAt12 = null;
    const sceneManagerCapture = new SceneManagerCaptureTodayAt12(
      {},
      event,
      {},
      {},
      variable,
      house,
      {},
      {},
      {},
      scheduler,
      brain,
    );
    // Force timezone to Europe/Paris to reproduce the UTC+2 mismatch
    sceneManagerCapture.timezone = 'Europe/Paris';

    // Simulate the server clock at midnight Paris = 22:00 UTC the day before
    const clock = sinon.useFakeTimers(new Date('2026-06-10T22:00:00Z').getTime());
    try {
      await sceneManagerCapture.dailyUpdate();
    } finally {
      clock.restore();
    }

    // todayAt12 must fall on 2026-06-11 in Paris (the actual "today" for the user),
    // not 2026-06-10 (yesterday in Paris, which is what the old buggy code produced).
    const parisDate = dayjs(capturedTodayAt12).tz('Europe/Paris');
    expect(parisDate.date()).to.equal(11);
    expect(parisDate.month()).to.equal(5); // June = month 5 (0-indexed)
    expect(parisDate.hour()).to.equal(12);
  });

  it("shouldn't scheduleJob for sunrise/sunset when house doesn't have location", async () => {
    house.get = fake.resolves([
      {
        latitude: null,
        longitude: null,
      },
    ]);
    await sceneManager.dailyUpdate();
    expect(sceneManager.jobs).to.have.lengthOf(0);
  });

  it("shouldn't scheduleJob for sunrise/sunset when no house", async () => {
    house.get = fake.resolves([]);
    await sceneManager.dailyUpdate();
    expect(sceneManager.jobs).to.have.lengthOf(0);
  });

  it('should schedule extra job for sunrise when a scene has offset=30', async () => {
    brain.addNamedEntity = fake.returns(null);
    await sceneManager.addScene({
      selector: 'scene-offset',
      active: true,
      actions: [],
      triggers: [
        {
          type: EVENTS.TIME.SUNRISE,
          house: 'house-1',
          offset: 30,
        },
      ],
    });
    // addScene auto-triggers dailyUpdate(); flush microtask to let it complete
    await Promise.resolve();
    // offset=0 sunrise + offset=30 sunrise + offset=0 sunset = 3 jobs
    expect(sceneManager.jobs).to.have.lengthOf(3);

    // Trigger all jobs and verify events are emitted with correct offsets
    const emittedOffsets = [];
    event.emit = (eventName, payload) => {
      emittedOffsets.push(payload.offset);
    };
    sceneManager.jobs.forEach((job) => {
      job.callback();
    });
    expect(emittedOffsets).to.include(0);
    expect(emittedOffsets).to.include(30);
  });

  it('should schedule extra job for sunset when a scene has negative offset=-15', async () => {
    brain.addNamedEntity = fake.returns(null);
    await sceneManager.addScene({
      selector: 'scene-offset-neg',
      active: true,
      actions: [],
      triggers: [
        {
          type: EVENTS.TIME.SUNSET,
          house: 'house-1',
          offset: -15,
        },
      ],
    });
    // addScene auto-triggers dailyUpdate(); flush microtask to let it complete
    await Promise.resolve();
    // offset=0 sunrise + offset=0 sunset + offset=-15 sunset = 3 jobs
    expect(sceneManager.jobs).to.have.lengthOf(3);

    const emittedOffsets = [];
    event.emit = (eventName, payload) => {
      emittedOffsets.push(payload.offset);
    };
    sceneManager.jobs.forEach((job) => {
      job.callback();
    });
    expect(emittedOffsets).to.include(0);
    expect(emittedOffsets).to.include(-15);
  });

  it('should not add extra jobs for an inactive scene with a sunrise trigger', async () => {
    brain.addNamedEntity = fake.returns(null);
    await sceneManager.addScene({
      selector: 'scene-inactive',
      active: false,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNRISE, house: 'house-1', offset: 30 }],
    });
    // addScene auto-triggers dailyUpdate(); flush microtask to let it complete
    await Promise.resolve();
    // Inactive scene offsets must be ignored: only offset=0 sunrise + offset=0 sunset = 2 jobs
    expect(sceneManager.jobs).to.have.lengthOf(2);
  });

  it('should not add extra jobs for a scene with no triggers', async () => {
    brain.addNamedEntity = fake.returns(null);
    await sceneManager.addScene({
      selector: 'scene-no-triggers',
      active: true,
      actions: [],
      triggers: null,
    });
    await sceneManager.dailyUpdate();
    // Scene without triggers must be ignored: only offset=0 sunrise + offset=0 sunset = 2 jobs
    expect(sceneManager.jobs).to.have.lengthOf(2);
  });

  it('should ignore a non-numeric offset (string)', async () => {
    brain.addNamedEntity = fake.returns(null);
    await sceneManager.addScene({
      selector: 'scene-bad-offset',
      active: true,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNRISE, house: 'house-1', offset: 'abc' }],
    });
    // addScene auto-triggers dailyUpdate(); flush microtask to let it complete
    await Promise.resolve();
    // invalid offset must be ignored: only offset=0 sunrise + offset=0 sunset = 2 jobs
    expect(sceneManager.jobs).to.have.lengthOf(2);
  });

  it('should ignore an offset exceeding 24h (offset > 1440)', async () => {
    brain.addNamedEntity = fake.returns(null);
    await sceneManager.addScene({
      selector: 'scene-huge-offset',
      active: true,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNRISE, house: 'house-1', offset: 1500 }],
    });
    // addScene auto-triggers dailyUpdate(); flush microtask to let it complete
    await Promise.resolve();
    // out-of-day offset must be ignored: only offset=0 sunrise + offset=0 sunset = 2 jobs
    expect(sceneManager.jobs).to.have.lengthOf(2);
  });

  it('should ignore a large negative offset exceeding 24h (offset < -1440)', async () => {
    brain.addNamedEntity = fake.returns(null);
    await sceneManager.addScene({
      selector: 'scene-huge-neg-offset',
      active: true,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNSET, house: 'house-1', offset: -1500 }],
    });
    // addScene auto-triggers dailyUpdate(); flush microtask to let it complete
    await Promise.resolve();
    // out-of-day offset must be ignored: only offset=0 sunrise + offset=0 sunset = 2 jobs
    expect(sceneManager.jobs).to.have.lengthOf(2);
  });

  it('should deduplicate offsets when multiple scenes share the same offset', async () => {
    brain.addNamedEntity = fake.returns(null);
    await sceneManager.addScene({
      selector: 'scene-a',
      active: true,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNRISE, house: 'house-1', offset: 30 }],
    });
    // flush first addScene auto-triggered dailyUpdate
    await Promise.resolve();
    await sceneManager.addScene({
      selector: 'scene-b',
      active: true,
      actions: [],
      triggers: [{ type: EVENTS.TIME.SUNRISE, house: 'house-1', offset: 30 }],
    });
    // addScene auto-triggers dailyUpdate(); flush microtask to let it complete
    await Promise.resolve();
    // offset=0 sunrise + offset=30 sunrise (deduplicated) + offset=0 sunset = 3 jobs
    expect(sceneManager.jobs).to.have.lengthOf(3);
  });
});
