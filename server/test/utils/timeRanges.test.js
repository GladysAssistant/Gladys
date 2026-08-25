const { expect } = require('chai');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');

const {
  isInTimeRanges,
  isOvernightRange,
  resolveTriggerTimeRanges,
  timeToMinutes,
  daysOfTheWeekToNumbers,
} = require('../../utils/timeRanges');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const TIMEZONE = 'Europe/Paris';

// 2026-08-24 is a monday, 2026-08-25 a tuesday.
const at = (date, time) => dayjs.tz(`${date} ${time}`, TIMEZONE);

describe('utils.timeRanges', () => {
  describe('timeToMinutes', () => {
    it('should convert a time to minutes', () => {
      expect(timeToMinutes('00:00')).to.equal(0);
      expect(timeToMinutes('14:30')).to.equal(870);
      expect(timeToMinutes('23:59')).to.equal(1439);
    });
  });

  describe('isOvernightRange', () => {
    it('should detect a range crossing midnight', () => {
      expect(isOvernightRange({ start: '22:00', end: '06:00' })).to.equal(true);
    });
    it('should not flag a normal range', () => {
      expect(isOvernightRange({ start: '12:00', end: '14:30' })).to.equal(false);
    });
  });

  describe('daysOfTheWeekToNumbers', () => {
    it('should convert the days to node-schedule numbers', () => {
      expect(daysOfTheWeekToNumbers(['monday', 'sunday'])).to.deep.equal([1, 0]);
    });
    it('should return no day when the list is explicitly empty', () => {
      // The user unselected every day: the editor warns the trigger will never fire, so
      // turning it into "every day" would do the exact opposite of what they were told.
      expect(daysOfTheWeekToNumbers([])).to.deep.equal([]);
    });
    it('should return every day when the list is missing', () => {
      expect(daysOfTheWeekToNumbers(undefined)).to.have.members([0, 1, 2, 3, 4, 5, 6]);
    });
    it('should ignore an unknown day', () => {
      expect(daysOfTheWeekToNumbers(['monday', 'notaday'])).to.deep.equal([1]);
    });
  });

  describe('resolveTriggerTimeRanges', () => {
    it('should apply the days of the trigger to every range', () => {
      const trigger = {
        days_of_the_week: ['monday'],
        time_ranges: [
          { start: '12:00', end: '14:30' },
          { start: '16:00', end: '17:30' },
        ],
      };
      expect(resolveTriggerTimeRanges(trigger)).to.deep.equal([
        { start: '12:00', end: '14:30', days_of_the_week: ['monday'] },
        { start: '16:00', end: '17:30', days_of_the_week: ['monday'] },
      ]);
    });

    it('should fall back to the days carried by a range saved by an earlier version', () => {
      const trigger = { time_ranges: [{ start: '12:00', end: '14:30', days_of_the_week: ['tuesday'] }] };
      expect(resolveTriggerTimeRanges(trigger)).to.deep.equal([
        { start: '12:00', end: '14:30', days_of_the_week: ['tuesday'] },
      ]);
    });

    it('should return undefined days when nothing is configured, which means every day', () => {
      const trigger = { time_ranges: [{ start: '12:00', end: '14:30', days_of_the_week: [] }] };
      expect(resolveTriggerTimeRanges(trigger)[0].days_of_the_week).to.equal(undefined);
    });

    it('should handle a trigger without any range', () => {
      expect(resolveTriggerTimeRanges({})).to.deep.equal([]);
    });
  });

  describe('isInTimeRanges', () => {
    const poolRanges = [
      { start: '12:00', end: '14:30' },
      { start: '16:00', end: '17:30' },
    ];

    it('should return false when there is no range', () => {
      expect(isInTimeRanges([], at('2026-08-24', '13:00'))).to.equal(false);
      expect(isInTimeRanges(undefined, at('2026-08-24', '13:00'))).to.equal(false);
    });

    it('should be inside the first range', () => {
      expect(isInTimeRanges(poolRanges, at('2026-08-24', '13:00'))).to.equal(true);
    });

    it('should be inside the second range', () => {
      expect(isInTimeRanges(poolRanges, at('2026-08-24', '16:30'))).to.equal(true);
    });

    it('should be outside between two ranges', () => {
      expect(isInTimeRanges(poolRanges, at('2026-08-24', '15:00'))).to.equal(false);
    });

    it('should include the start of a range', () => {
      expect(isInTimeRanges(poolRanges, at('2026-08-24', '12:00'))).to.equal(true);
    });

    it('should exclude the end of a range', () => {
      expect(isInTimeRanges(poolRanges, at('2026-08-24', '14:30'))).to.equal(false);
    });

    it('should return false for a range covering nothing', () => {
      expect(isInTimeRanges([{ start: '12:00', end: '12:00' }], at('2026-08-24', '12:00'))).to.equal(false);
    });

    it('should only match the configured days', () => {
      const ranges = [{ start: '12:00', end: '14:30', days_of_the_week: ['monday'] }];
      expect(isInTimeRanges(ranges, at('2026-08-24', '13:00'))).to.equal(true);
      expect(isInTimeRanges(ranges, at('2026-08-25', '13:00'))).to.equal(false);
    });

    describe('overnight range', () => {
      const overnight = [{ start: '22:00', end: '06:00', days_of_the_week: ['monday'] }];

      it('should be inside on the evening of the configured day', () => {
        expect(isInTimeRanges(overnight, at('2026-08-24', '23:00'))).to.equal(true);
      });

      it('should still be inside on the next morning', () => {
        expect(isInTimeRanges(overnight, at('2026-08-25', '05:00'))).to.equal(true);
      });

      it('should be outside after the end, on the next morning', () => {
        expect(isInTimeRanges(overnight, at('2026-08-25', '07:00'))).to.equal(false);
      });

      it('should not start again on a day which is not configured', () => {
        expect(isInTimeRanges(overnight, at('2026-08-25', '23:00'))).to.equal(false);
      });
    });
  });
});
