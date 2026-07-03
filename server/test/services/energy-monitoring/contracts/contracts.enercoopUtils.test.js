const { expect } = require('chai');
const {
  isEnercoopNuitWeekendOffPeak,
  isEnercoop2SaisonsOffPeak,
  getEnercoopConsumptionContext,
} = require('../../../../services/energy-monitoring/contracts/contracts.enercoopUtils');

describe('Enercoop utils', () => {
  const publicHolidaysSet = new Set(['2025-05-01']);

  describe('Enercoop Nuit & Week-end', () => {
    it('should be off-peak at night on weekdays', () => {
      const context = getEnercoopConsumptionContext(
        new Date('2025-03-10T22:30:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(isEnercoopNuitWeekendOffPeak(context)).to.equal(true);
    });

    it('should be peak during daytime on weekdays', () => {
      const context = getEnercoopConsumptionContext(
        new Date('2025-03-10T10:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(isEnercoopNuitWeekendOffPeak(context)).to.equal(false);
    });

    it('should be off-peak all day on weekends', () => {
      const context = getEnercoopConsumptionContext(
        new Date('2025-03-15T14:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(isEnercoopNuitWeekendOffPeak(context)).to.equal(true);
    });

    it('should be off-peak all day on public holidays', () => {
      const context = getEnercoopConsumptionContext(
        new Date('2025-05-01T14:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(isEnercoopNuitWeekendOffPeak(context)).to.equal(true);
    });
  });

  describe('Enercoop 2 Saisons', () => {
    it('should use winter weekday slots in March', () => {
      const morningContext = getEnercoopConsumptionContext(
        new Date('2025-03-10T05:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );
      const afternoonContext = getEnercoopConsumptionContext(
        new Date('2025-03-10T14:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );
      const peakContext = getEnercoopConsumptionContext(
        new Date('2025-03-10T10:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );

      expect(isEnercoop2SaisonsOffPeak(morningContext)).to.equal(true);
      expect(isEnercoop2SaisonsOffPeak(afternoonContext)).to.equal(true);
      expect(isEnercoop2SaisonsOffPeak(peakContext)).to.equal(false);
    });

    it('should use summer weekday slots in July', () => {
      const offPeakContext = getEnercoopConsumptionContext(
        new Date('2025-07-15T12:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );
      const peakContext = getEnercoopConsumptionContext(
        new Date('2025-07-15T08:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );

      expect(isEnercoop2SaisonsOffPeak(offPeakContext)).to.equal(true);
      expect(isEnercoop2SaisonsOffPeak(peakContext)).to.equal(false);
    });

    it('should be off-peak all day on weekends', () => {
      const context = getEnercoopConsumptionContext(
        new Date('2025-07-19T10:00:00.000Z'),
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(isEnercoop2SaisonsOffPeak(context)).to.equal(true);
    });
  });
});
