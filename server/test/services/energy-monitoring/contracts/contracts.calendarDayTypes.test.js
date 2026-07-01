const { expect } = require('chai');
const {
  getFrenchPublicHolidaysForYear,
  isFrenchPublicHoliday,
} = require('../../../../services/energy-monitoring/contracts/contracts.isFrenchPublicHoliday');
const {
  getConsumptionCalendarDayType,
} = require('../../../../services/energy-monitoring/contracts/contracts.getConsumptionCalendarDayType');
const { ENERGY_PRICE_DAY_TYPES } = require('../../../../utils/constants');

describe('contracts.isFrenchPublicHoliday', () => {
  it('should include fixed French national holidays', () => {
    const holidays2024 = getFrenchPublicHolidaysForYear(2024);
    expect(holidays2024.has('2024-01-01')).to.equal(true);
    expect(holidays2024.has('2024-05-01')).to.equal(true);
    expect(holidays2024.has('2024-07-14')).to.equal(true);
    expect(holidays2024.has('2024-12-25')).to.equal(true);
  });

  it('should include Easter Monday for 2024', () => {
    expect(isFrenchPublicHoliday('2024-04-01')).to.equal(true);
  });

  it('should return false for regular weekdays', () => {
    expect(isFrenchPublicHoliday('2024-03-12')).to.equal(false);
  });
});

describe('contracts.getConsumptionCalendarDayType', () => {
  it('should return weekday for a regular Tuesday', () => {
    const dayType = getConsumptionCalendarDayType(new Date('2024-03-12T10:00:00.000Z'), 'Europe/Paris');
    expect(dayType).to.equal(ENERGY_PRICE_DAY_TYPES.WEEKDAY);
  });

  it('should return weekend for a Saturday', () => {
    const dayType = getConsumptionCalendarDayType(new Date('2024-03-16T10:00:00.000Z'), 'Europe/Paris');
    expect(dayType).to.equal(ENERGY_PRICE_DAY_TYPES.WEEKEND);
  });

  it('should return holiday for a public holiday', () => {
    const dayType = getConsumptionCalendarDayType(new Date('2024-05-01T10:00:00.000Z'), 'Europe/Paris');
    expect(dayType).to.equal(ENERGY_PRICE_DAY_TYPES.HOLIDAY);
  });
});
