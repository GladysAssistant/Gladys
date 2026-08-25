const sinon = require('sinon').createSandbox();
const chaiAssert = require('chai').assert;
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');

const { useFakeTimers } = sinon;
const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const actionsFunc = require('../../../../lib/scene/scene.actions');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const TIMEZONE = 'Europe/Paris';

describe('scene.action.inTimeRange', () => {
  const inTimeRange = actionsFunc[ACTIONS.SCENE.IN_TIME_RANGE];

  // A scene driven by a time-range trigger: 12:00 -> 14:30 every day.
  const buildSelf = (triggers) => ({
    timezone: TIMEZONE,
    scenes: {
      'my-scene': { selector: 'my-scene', triggers },
    },
  });

  const timeRangeTrigger = {
    key: 'my-trigger-key',
    scheduler_type: 'time-range',
    time_ranges: [{ start: '12:00', end: '14:30' }],
  };

  afterEach(() => {
    sinon.restore();
  });

  describe('started by its own trigger', () => {
    it('should continue at the start of a range', async () => {
      const scope = { sceneSelector: 'my-scene', triggerEvent: { key: 'my-trigger-key', in_range: true } };
      await inTimeRange(buildSelf([timeRangeTrigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope);
    });

    it('should abort at the end of a range', async () => {
      const scope = { sceneSelector: 'my-scene', triggerEvent: { key: 'my-trigger-key', in_range: false } };
      await chaiAssert.isRejected(
        inTimeRange(buildSelf([timeRangeTrigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope),
        AbortScene,
      );
    });

    it('should continue at the end of a range when the condition is inverted', async () => {
      const scope = { sceneSelector: 'my-scene', triggerEvent: { key: 'my-trigger-key', in_range: false } };
      await inTimeRange(buildSelf([timeRangeTrigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE, in_range: false }, scope);
    });

    it('should trust the trigger rather than the clock', async () => {
      // The clock says we are outside the range, but the trigger fired a "start":
      // the trigger wins, otherwise a job firing a few milliseconds early would be lost.
      useFakeTimers(dayjs.tz('2026-08-24 20:00', TIMEZONE).valueOf());
      const scope = { sceneSelector: 'my-scene', triggerEvent: { key: 'my-trigger-key', in_range: true } };
      await inTimeRange(buildSelf([timeRangeTrigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope);
    });
  });

  describe('started by another scene', () => {
    // `scene.start` hands the child a clone of the parent's scope, `triggerEvent` included.
    // The child must answer for its OWN ranges, not for the range the parent reacted to.
    it('should ignore the trigger event of the calling scene', async () => {
      // 14:00: outside the parent's range (which just ended), inside the child's one.
      useFakeTimers(dayjs.tz('2026-08-24 14:00', TIMEZONE).valueOf());
      const childTrigger = {
        key: 'child-trigger-key',
        scheduler_type: 'time-range',
        time_ranges: [{ start: '08:00', end: '20:00' }],
      };
      const scope = { sceneSelector: 'my-scene', triggerEvent: { key: 'parent-trigger-key', in_range: false } };
      await inTimeRange(buildSelf([childTrigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope);
    });

    it('should abort when the child scene is outside its own ranges', async () => {
      useFakeTimers(dayjs.tz('2026-08-24 22:00', TIMEZONE).valueOf());
      const childTrigger = {
        key: 'child-trigger-key',
        scheduler_type: 'time-range',
        time_ranges: [{ start: '08:00', end: '20:00' }],
      };
      const scope = { sceneSelector: 'my-scene', triggerEvent: { key: 'parent-trigger-key', in_range: true } };
      await chaiAssert.isRejected(
        inTimeRange(buildSelf([childTrigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope),
        AbortScene,
      );
    });
  });

  describe('started manually', () => {
    it('should continue when the current time is inside a range', async () => {
      useFakeTimers(dayjs.tz('2026-08-24 13:00', TIMEZONE).valueOf());
      const scope = { sceneSelector: 'my-scene' };
      await inTimeRange(buildSelf([timeRangeTrigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope);
    });

    it('should abort when the current time is outside the ranges', async () => {
      useFakeTimers(dayjs.tz('2026-08-24 20:00', TIMEZONE).valueOf());
      const scope = { sceneSelector: 'my-scene' };
      await chaiAssert.isRejected(
        inTimeRange(buildSelf([timeRangeTrigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope),
        AbortScene,
      );
    });

    it('should take the days of the week of the trigger into account', async () => {
      // 2026-08-24 is a monday, the trigger only runs on tuesday.
      useFakeTimers(dayjs.tz('2026-08-24 13:00', TIMEZONE).valueOf());
      const scope = { sceneSelector: 'my-scene' };
      const trigger = { ...timeRangeTrigger, days_of_the_week: ['tuesday'] };
      await chaiAssert.isRejected(
        inTimeRange(buildSelf([trigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope),
        AbortScene,
      );
    });

    it('should abort when the scene has no time-range trigger', async () => {
      const scope = { sceneSelector: 'my-scene' };
      const trigger = { scheduler_type: 'every-day', time: '09:00' };
      await chaiAssert.isRejected(
        inTimeRange(buildSelf([trigger]), { type: ACTIONS.SCENE.IN_TIME_RANGE }, scope),
        AbortScene,
      );
    });
  });
});
