const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');

const { EVENTS } = require('../../../../utils/constants');
const { triggersFunc } = require('../../../../lib/scene/scene.triggers');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const TIMEZONE = 'Europe/Paris';

describe('Scene.triggers.timeRange', () => {
  const self = { timezone: TIMEZONE };

  const trigger = {
    type: EVENTS.TIME.CHANGED,
    scheduler_type: 'time-range',
    key: 'trigger-key',
    time_ranges: [
      { start: '12:00', end: '14:30' },
      { start: '16:00', end: '17:30' },
    ],
  };

  const check = (event) => triggersFunc[EVENTS.TIME.CHANGED](self, 'a-scene', event, trigger);

  afterEach(() => {
    sinon.restore();
  });

  it('should NOT match an event of another trigger', () => {
    expect(check({ key: 'another-key', range_event: 'start' })).to.equal(false);
  });

  it('should match the start of a range and be in range', () => {
    const event = { key: 'trigger-key', range_event: 'start' };
    expect(check(event)).to.equal(true);
    expect(event.in_range).to.equal(true);
  });

  it('should match the end of a range and be out of range', () => {
    sinon.useFakeTimers(dayjs.tz('2026-08-24 14:30', TIMEZONE).valueOf());
    const event = { key: 'trigger-key', range_event: 'end', range_index: 0 };
    expect(check(event)).to.equal(true);
    expect(event.in_range).to.equal(false);
  });

  it('should not touch in_range on a classic scheduled trigger', () => {
    const classicTrigger = { type: EVENTS.TIME.CHANGED, scheduler_type: 'every-day', key: 'trigger-key' };
    const event = { key: 'trigger-key' };
    expect(triggersFunc[EVENTS.TIME.CHANGED](self, 'a-scene', event, classicTrigger)).to.equal(true);
    expect(event).to.not.have.property('in_range');
  });

  // The end of a range does not mean the end of the planning: another range of the same
  // trigger may already cover this minute, and turning the device off then would leave it
  // off for the rest of that range.
  describe('several ranges sharing a moment', () => {
    const checkWith = (timeRanges, event) =>
      triggersFunc[EVENTS.TIME.CHANGED](self, 'a-scene', event, { ...trigger, time_ranges: timeRanges });

    it('should stay in range at the shared boundary of two consecutive ranges', () => {
      // "10:00 -> 12:00" then "12:00 -> 14:00": at 12:00 the planning continues.
      sinon.useFakeTimers(dayjs.tz('2026-08-24 12:00', TIMEZONE).valueOf());
      const event = { key: 'trigger-key', range_event: 'end', range_index: 0 };
      expect(
        checkWith(
          [
            { start: '10:00', end: '12:00' },
            { start: '12:00', end: '14:00' },
          ],
          event,
        ),
      ).to.equal(true);
      expect(event.in_range).to.equal(true);
    });

    it('should stay in range when the end of a range falls inside an overlapping one', () => {
      // "10:00 -> 12:00" and "11:00 -> 14:00": at 12:00 the second one is still running.
      sinon.useFakeTimers(dayjs.tz('2026-08-24 12:00', TIMEZONE).valueOf());
      const event = { key: 'trigger-key', range_event: 'end', range_index: 0 };
      expect(
        checkWith(
          [
            { start: '10:00', end: '12:00' },
            { start: '11:00', end: '14:00' },
          ],
          event,
        ),
      ).to.equal(true);
      expect(event.in_range).to.equal(true);
    });

    it('should leave the planning at the end of the last range of a chain', () => {
      sinon.useFakeTimers(dayjs.tz('2026-08-24 14:00', TIMEZONE).valueOf());
      const event = { key: 'trigger-key', range_event: 'end', range_index: 1 };
      expect(
        checkWith(
          [
            { start: '10:00', end: '12:00' },
            { start: '12:00', end: '14:00' },
          ],
          event,
        ),
      ).to.equal(true);
      expect(event.in_range).to.equal(false);
    });

    it('should ignore the range which just ended, even if the tick is early', () => {
      // A job firing a few milliseconds early lands in the previous minute, still inside
      // the range it ends: excluding that range is what keeps the answer right.
      sinon.useFakeTimers(dayjs.tz('2026-08-24 14:29', TIMEZONE).valueOf());
      const event = { key: 'trigger-key', range_event: 'end', range_index: 0 };
      expect(check(event)).to.equal(true);
      expect(event.in_range).to.equal(false);
    });
  });

  describe('resume at startup', () => {
    // Gladys restarted at 13:00: the pump should still be running, the scene is resumed
    // with in_range = true so it can switch it back on if it was stopped meanwhile.
    it('should be in range when restarting inside a range', () => {
      sinon.useFakeTimers(dayjs.tz('2026-08-24 13:00', TIMEZONE).valueOf());
      const event = { key: 'trigger-key', range_event: 'resume' };
      expect(check(event)).to.equal(true);
      expect(event.in_range).to.equal(true);
    });

    // Gladys restarted at 15:00, after the end of the first range: the pump may have been
    // left on while Gladys was down, so the scene is resumed with in_range = false.
    it('should be out of range when restarting between two ranges', () => {
      sinon.useFakeTimers(dayjs.tz('2026-08-24 15:00', TIMEZONE).valueOf());
      const event = { key: 'trigger-key', range_event: 'resume' };
      expect(check(event)).to.equal(true);
      expect(event.in_range).to.equal(false);
    });

    it('should be in range when restarting inside the second range', () => {
      sinon.useFakeTimers(dayjs.tz('2026-08-24 17:00', TIMEZONE).valueOf());
      const event = { key: 'trigger-key', range_event: 'resume' };
      expect(check(event)).to.equal(true);
      expect(event.in_range).to.equal(true);
    });
  });
});
