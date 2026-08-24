const { expect } = require('chai');

const {
  ENERGY_PERIODS,
  DEFAULT_ENERGY_PERIOD_START_DAY,
  MIN_ENERGY_PERIOD_START_DAY,
  MAX_ENERGY_PERIOD_START_DAY,
  getDaysInMonth,
  getPeriodStartDayInMonth,
  parseEnergyPeriodStartDay,
  getEnergyPeriodStartInCalendarUnit,
  getEnergyPeriodStart,
  getNextEnergyPeriodStart,
  getPreviousEnergyPeriodStart,
} = require('../../utils/energyPeriod');

// Local date, without any timezone conversion: the widget and the DuckDB
// buckets both work on local midnights.
const localDate = (year, monthIndex, day) => new Date(year, monthIndex, day, 0, 0, 0, 0);

describe('utils/energyPeriod', () => {
  describe('constants', () => {
    it('should expose the default and the boundaries of the start day', () => {
      expect(DEFAULT_ENERGY_PERIOD_START_DAY).to.equal(1);
      expect(MIN_ENERGY_PERIOD_START_DAY).to.equal(1);
      expect(MAX_ENERGY_PERIOD_START_DAY).to.equal(31);
      expect(ENERGY_PERIODS).to.deep.equal({ DAY: 'day', MONTH: 'month', YEAR: 'year' });
    });
  });

  describe('getDaysInMonth', () => {
    it('should return the number of days of a 31 days month', () => {
      expect(getDaysInMonth(2023, 0)).to.equal(31);
    });
    it('should return the number of days of a 30 days month', () => {
      expect(getDaysInMonth(2023, 3)).to.equal(30);
    });
    it('should return 28 days in February on a non leap year', () => {
      expect(getDaysInMonth(2023, 1)).to.equal(28);
    });
    it('should return 29 days in February on a leap year', () => {
      expect(getDaysInMonth(2024, 1)).to.equal(29);
    });
    it('should roll over to December of the previous year', () => {
      expect(getDaysInMonth(2023, -1)).to.equal(31);
    });
    it('should roll over to January of the next year', () => {
      expect(getDaysInMonth(2023, 12)).to.equal(31);
    });
  });

  describe('getPeriodStartDayInMonth', () => {
    it('should return the start day when the month is long enough', () => {
      expect(getPeriodStartDayInMonth(2023, 0, 5)).to.equal(5);
    });
    it('should clamp the start day to the last day of February', () => {
      expect(getPeriodStartDayInMonth(2023, 1, 31)).to.equal(28);
    });
    it('should clamp the start day to the last day of February on a leap year', () => {
      expect(getPeriodStartDayInMonth(2024, 1, 31)).to.equal(29);
    });
    it('should clamp the start day to the last day of a 30 days month', () => {
      expect(getPeriodStartDayInMonth(2023, 3, 31)).to.equal(30);
    });
  });

  describe('parseEnergyPeriodStartDay', () => {
    it('should default to 1 when undefined', () => {
      expect(parseEnergyPeriodStartDay(undefined)).to.equal(1);
    });
    it('should default to 1 when null', () => {
      expect(parseEnergyPeriodStartDay(null)).to.equal(1);
    });
    it('should default to 1 when empty string', () => {
      expect(parseEnergyPeriodStartDay('')).to.equal(1);
    });
    it('should parse a number', () => {
      expect(parseEnergyPeriodStartDay(5)).to.equal(5);
    });
    it('should parse a string coming from an HTTP query', () => {
      expect(parseEnergyPeriodStartDay('31')).to.equal(31);
    });
    it('should return null when not a number', () => {
      expect(parseEnergyPeriodStartDay('not-a-number')).to.equal(null);
    });
    it('should return null when not an integer', () => {
      expect(parseEnergyPeriodStartDay(5.5)).to.equal(null);
    });
    it('should return null when too small', () => {
      expect(parseEnergyPeriodStartDay(0)).to.equal(null);
    });
    it('should return null when too big', () => {
      expect(parseEnergyPeriodStartDay(32)).to.equal(null);
    });
  });

  describe('getEnergyPeriodStartInCalendarUnit', () => {
    it('should return the start of the period beginning in this month', () => {
      expect(getEnergyPeriodStartInCalendarUnit(localDate(2023, 2, 1), 'month', 5)).to.deep.equal(
        localDate(2023, 2, 5),
      );
    });
    it('should clamp the start day in February', () => {
      expect(getEnergyPeriodStartInCalendarUnit(localDate(2023, 1, 1), 'month', 31)).to.deep.equal(
        localDate(2023, 1, 28),
      );
    });
    it('should return the start of the period beginning in this year', () => {
      expect(getEnergyPeriodStartInCalendarUnit(localDate(2023, 6, 20), 'year', 5)).to.deep.equal(
        localDate(2023, 0, 5),
      );
    });
    it('should return the day at midnight for a day period', () => {
      expect(getEnergyPeriodStartInCalendarUnit(new Date(2023, 6, 20, 15, 32, 12), 'day', 5)).to.deep.equal(
        localDate(2023, 6, 20),
      );
    });
    it('should default to a start day of 1', () => {
      expect(getEnergyPeriodStartInCalendarUnit(localDate(2023, 2, 18), 'month')).to.deep.equal(localDate(2023, 2, 1));
    });
  });

  describe('getEnergyPeriodStart', () => {
    it('should keep the calendar month when the start day is 1', () => {
      expect(getEnergyPeriodStart(localDate(2023, 2, 18), 'month', 1)).to.deep.equal(localDate(2023, 2, 1));
    });
    it('should keep the calendar year when the start day is 1', () => {
      expect(getEnergyPeriodStart(localDate(2023, 2, 18), 'year', 1)).to.deep.equal(localDate(2023, 0, 1));
    });
    it('should return the current month period when the date is after the start day', () => {
      expect(getEnergyPeriodStart(localDate(2023, 2, 18), 'month', 5)).to.deep.equal(localDate(2023, 2, 5));
    });
    it('should return the current month period when the date is exactly the start day', () => {
      expect(getEnergyPeriodStart(localDate(2023, 2, 5), 'month', 5)).to.deep.equal(localDate(2023, 2, 5));
    });
    it('should return the previous month period when the date is before the start day', () => {
      expect(getEnergyPeriodStart(localDate(2023, 2, 4), 'month', 5)).to.deep.equal(localDate(2023, 1, 5));
    });
    it('should cross the year boundary backward', () => {
      expect(getEnergyPeriodStart(localDate(2023, 0, 2), 'month', 5)).to.deep.equal(localDate(2022, 11, 5));
    });
    it('should clamp the start day on February for a start day of 31', () => {
      expect(getEnergyPeriodStart(localDate(2023, 1, 28), 'month', 31)).to.deep.equal(localDate(2023, 1, 28));
    });
    it('should return the January period on the 27th of February with a start day of 31', () => {
      expect(getEnergyPeriodStart(localDate(2023, 1, 27), 'month', 31)).to.deep.equal(localDate(2023, 0, 31));
    });
    it('should clamp the start day on February of a leap year', () => {
      expect(getEnergyPeriodStart(localDate(2024, 1, 29), 'month', 30)).to.deep.equal(localDate(2024, 1, 29));
    });
    it('should return the current year period when the date is after the start day', () => {
      expect(getEnergyPeriodStart(localDate(2023, 5, 18), 'year', 5)).to.deep.equal(localDate(2023, 0, 5));
    });
    it('should return the previous year period when the date is before the start day', () => {
      expect(getEnergyPeriodStart(localDate(2023, 0, 4), 'year', 5)).to.deep.equal(localDate(2022, 0, 5));
    });
    it('should return the day at midnight for a day period', () => {
      expect(getEnergyPeriodStart(new Date(2023, 6, 20, 15, 32, 12), 'day', 5)).to.deep.equal(localDate(2023, 6, 20));
    });
    it('should be idempotent on a period start', () => {
      const periodStart = getEnergyPeriodStart(localDate(2023, 1, 10), 'month', 31);
      expect(getEnergyPeriodStart(periodStart, 'month', 31)).to.deep.equal(periodStart);
    });
  });

  describe('getNextEnergyPeriodStart', () => {
    it('should return the next calendar month when the start day is 1', () => {
      expect(getNextEnergyPeriodStart(localDate(2023, 2, 1), 'month', 1)).to.deep.equal(localDate(2023, 3, 1));
    });
    it('should return the next offset month', () => {
      expect(getNextEnergyPeriodStart(localDate(2023, 2, 5), 'month', 5)).to.deep.equal(localDate(2023, 3, 5));
    });
    it('should cross the year boundary forward', () => {
      expect(getNextEnergyPeriodStart(localDate(2023, 11, 5), 'month', 5)).to.deep.equal(localDate(2024, 0, 5));
    });
    it('should clamp the next month start day in February', () => {
      expect(getNextEnergyPeriodStart(localDate(2023, 0, 31), 'month', 31)).to.deep.equal(localDate(2023, 1, 28));
    });
    it('should go back to the 31st after a clamped February', () => {
      expect(getNextEnergyPeriodStart(localDate(2023, 1, 28), 'month', 31)).to.deep.equal(localDate(2023, 2, 31));
    });
    it('should return the next year', () => {
      expect(getNextEnergyPeriodStart(localDate(2023, 0, 5), 'year', 5)).to.deep.equal(localDate(2024, 0, 5));
    });
    it('should return the next day', () => {
      expect(getNextEnergyPeriodStart(localDate(2023, 0, 31), 'day', 5)).to.deep.equal(localDate(2023, 1, 1));
    });
    it('should default to a start day of 1', () => {
      expect(getNextEnergyPeriodStart(localDate(2023, 2, 1), 'month')).to.deep.equal(localDate(2023, 3, 1));
    });
  });

  describe('getPreviousEnergyPeriodStart', () => {
    it('should return the previous calendar month when the start day is 1', () => {
      expect(getPreviousEnergyPeriodStart(localDate(2023, 2, 1), 'month', 1)).to.deep.equal(localDate(2023, 1, 1));
    });
    it('should return the previous offset month', () => {
      expect(getPreviousEnergyPeriodStart(localDate(2023, 2, 5), 'month', 5)).to.deep.equal(localDate(2023, 1, 5));
    });
    it('should cross the year boundary backward', () => {
      expect(getPreviousEnergyPeriodStart(localDate(2023, 0, 5), 'month', 5)).to.deep.equal(localDate(2022, 11, 5));
    });
    it('should clamp the previous month start day in February', () => {
      expect(getPreviousEnergyPeriodStart(localDate(2023, 2, 31), 'month', 31)).to.deep.equal(localDate(2023, 1, 28));
    });
    it('should return the previous year', () => {
      expect(getPreviousEnergyPeriodStart(localDate(2023, 0, 5), 'year', 5)).to.deep.equal(localDate(2022, 0, 5));
    });
    it('should return the previous day', () => {
      expect(getPreviousEnergyPeriodStart(localDate(2023, 1, 1), 'day', 5)).to.deep.equal(localDate(2023, 0, 31));
    });
    it('should default to a start day of 1', () => {
      expect(getPreviousEnergyPeriodStart(localDate(2023, 2, 1), 'month')).to.deep.equal(localDate(2023, 1, 1));
    });
  });

  describe('period continuity', () => {
    it('should chain months without any gap or overlap for every start day', () => {
      for (let startDay = 1; startDay <= 31; startDay += 1) {
        let periodStart = getEnergyPeriodStart(localDate(2023, 0, 15), 'month', startDay);
        // Walk two full years, including a leap year
        for (let i = 0; i < 24; i += 1) {
          const nextPeriodStart = getNextEnergyPeriodStart(periodStart, 'month', startDay);
          expect(nextPeriodStart.getTime()).to.be.above(periodStart.getTime());
          // The last millisecond of the period belongs to the period
          const lastInstant = new Date(nextPeriodStart.getTime() - 1);
          expect(getEnergyPeriodStart(lastInstant, 'month', startDay)).to.deep.equal(periodStart);
          // The first millisecond of the next period belongs to the next period
          expect(getEnergyPeriodStart(nextPeriodStart, 'month', startDay)).to.deep.equal(nextPeriodStart);
          // Going back returns to the previous period
          expect(getPreviousEnergyPeriodStart(nextPeriodStart, 'month', startDay)).to.deep.equal(periodStart);
          periodStart = nextPeriodStart;
        }
      }
    });

    it('should chain years without any gap or overlap for every start day', () => {
      for (let startDay = 1; startDay <= 31; startDay += 1) {
        let periodStart = getEnergyPeriodStart(localDate(2022, 5, 15), 'year', startDay);
        for (let i = 0; i < 4; i += 1) {
          const nextPeriodStart = getNextEnergyPeriodStart(periodStart, 'year', startDay);
          const lastInstant = new Date(nextPeriodStart.getTime() - 1);
          expect(getEnergyPeriodStart(lastInstant, 'year', startDay)).to.deep.equal(periodStart);
          expect(getEnergyPeriodStart(nextPeriodStart, 'year', startDay)).to.deep.equal(nextPeriodStart);
          expect(getPreviousEnergyPeriodStart(nextPeriodStart, 'year', startDay)).to.deep.equal(periodStart);
          periodStart = nextPeriodStart;
        }
      }
    });

    it('should always start a period at local midnight, even across DST changes', () => {
      // Europe/Paris switches to summer time on the 26th of March 2023
      for (let startDay = 1; startDay <= 31; startDay += 1) {
        let periodStart = getEnergyPeriodStart(localDate(2023, 0, 15), 'month', startDay);
        for (let i = 0; i < 12; i += 1) {
          expect(periodStart.getHours()).to.equal(0);
          expect(periodStart.getMinutes()).to.equal(0);
          expect(periodStart.getSeconds()).to.equal(0);
          expect(periodStart.getMilliseconds()).to.equal(0);
          periodStart = getNextEnergyPeriodStart(periodStart, 'month', startDay);
        }
      }
    });
  });
});
