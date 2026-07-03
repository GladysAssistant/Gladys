const { expect, assert } = require('chai');
const { ENERGY_CONTRACT_TYPES } = require('../../../../utils/constants');
const contractsCalculateCost = require('../../../../services/energy-monitoring/contracts/contracts.calculateCost');

describe('Contracts.calculateCost', () => {
  describe('BASE contract', () => {
    it('should calculate cost correctly with valid price', async () => {
      const energyPricesAtConsumptionDate = [
        {
          price: 1500, // 0.1500 EUR/kWh (stored as integer with 4 decimals)
          currency: 'EUR',
        },
      ];
      const consumptionDate = new Date('2023-10-15T10:30:00.000Z');
      const consumptionValue = 10; // 10 kWh

      const cost = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.BASE](
        energyPricesAtConsumptionDate,
        consumptionDate,
        consumptionValue,
      );

      expect(cost).to.equal(1.5); // 0.1500 * 10 = 1.5 EUR
    });

    it('should throw NotFoundError when no price is found', async () => {
      const energyPricesAtConsumptionDate = [];
      const consumptionDate = new Date('2023-10-15T10:30:00.000Z');
      const consumptionValue = 10;

      const promise = contractsCalculateCost[ENERGY_CONTRACT_TYPES.BASE](
        energyPricesAtConsumptionDate,
        consumptionDate,
        consumptionValue,
      );

      return assert.isRejected(promise, 'No price found for this contract');
    });

    it('should calculate cost with different consumption values', async () => {
      const energyPricesAtConsumptionDate = [
        {
          price: 2000, // 0.2000 EUR/kWh
          currency: 'EUR',
        },
      ];
      const consumptionDate = new Date('2023-10-15T10:30:00.000Z');

      // Test with 5 kWh
      const cost1 = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.BASE](
        energyPricesAtConsumptionDate,
        consumptionDate,
        5,
      );
      expect(cost1).to.equal(1.0); // 0.2000 * 5 = 1.0 EUR

      // Test with 0 kWh
      const cost2 = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.BASE](
        energyPricesAtConsumptionDate,
        consumptionDate,
        0,
      );
      expect(cost2).to.equal(0); // 0.2000 * 0 = 0 EUR

      // Test with fractional consumption
      const cost3 = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.BASE](
        energyPricesAtConsumptionDate,
        consumptionDate,
        2.5,
      );
      expect(cost3).to.equal(0.5); // 0.2000 * 2.5 = 0.5 EUR
    });
  });

  describe('PEAK_OFF_PEAK contract', () => {
    it('should throw NotFoundError when no price is found for time slot', async () => {
      const energyPricesAtConsumptionDate = [
        {
          price: 1500,
          currency: 'EUR',
          hour_slots: '08:00,08:30,09:00', // Only morning slots
        },
      ];
      const consumptionDate = new Date('2023-10-15T14:30:00.000Z'); // 14:30 UTC
      const consumptionValue = 10;
      const systemTimezone = 'Europe/Paris'; // 16:30 in Paris timezone

      const promise = contractsCalculateCost[ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK](
        energyPricesAtConsumptionDate,
        consumptionDate,
        consumptionValue,
        systemTimezone,
      );

      return assert.isRejected(promise, 'No price found for time slot');
    });

    it('should calculate cost correctly for matching time slot', async () => {
      const energyPricesAtConsumptionDate = [
        {
          price: 1500, // Peak price
          currency: 'EUR',
          hour_slots: '08:00,08:30,09:00,16:00,16:30,17:00',
        },
        {
          price: 1000, // Off-peak price
          currency: 'EUR',
          hour_slots: '00:00,00:30,01:00,22:00,22:30,23:00,23:30',
        },
      ];
      const consumptionDate = new Date('2023-10-15T14:30:00.000Z'); // 14:30 UTC = 16:30 Paris
      const consumptionValue = 10;
      const systemTimezone = 'Europe/Paris';

      const cost = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK](
        energyPricesAtConsumptionDate,
        consumptionDate,
        consumptionValue,
        systemTimezone,
      );

      expect(cost).to.equal(1.5); // 0.1500 * 10 = 1.5 EUR (peak price)
    });
  });

  describe('EDF_TEMPO contract', () => {
    it('should throw NotFoundError when no tempo data found for the day', async () => {
      const energyPricesAtConsumptionDate = [
        {
          price: 1500,
          currency: 'EUR',
          day_type: 'BLUE',
          hour_slots: '08:00,08:30,09:00',
        },
      ];
      const consumptionDate = new Date('2023-10-15T10:30:00.000Z');
      const consumptionValue = 10;
      const systemTimezone = 'Europe/Paris';
      const edfTempoHistoricalMap = new Map(); // Empty map - no tempo data

      const promise = contractsCalculateCost[ENERGY_CONTRACT_TYPES.EDF_TEMPO](
        energyPricesAtConsumptionDate,
        consumptionDate,
        consumptionValue,
        systemTimezone,
        { edfTempoHistoricalMap },
      );

      return assert.isRejected(promise, 'No tempo data found for this day');
    });

    it('should throw NotFoundError when no price found for time slot', async () => {
      const energyPricesAtConsumptionDate = [
        {
          price: 1500,
          currency: 'EUR',
          day_type: 'BLUE',
          hour_slots: '08:00,08:30,09:00', // Only morning slots
        },
      ];
      const consumptionDate = new Date('2023-10-15T14:30:00.000Z'); // 16:30 Paris time
      const consumptionValue = 10;
      const systemTimezone = 'Europe/Paris';
      const edfTempoHistoricalMap = new Map();
      edfTempoHistoricalMap.set('2023-10-15', 'BLUE');

      const promise = contractsCalculateCost[ENERGY_CONTRACT_TYPES.EDF_TEMPO](
        energyPricesAtConsumptionDate,
        consumptionDate,
        consumptionValue,
        systemTimezone,
        { edfTempoHistoricalMap },
      );

      return assert.isRejected(promise, 'No price found for time slot');
    });

    it('should calculate cost correctly for matching tempo day and time slot', async () => {
      const energyPricesAtConsumptionDate = [
        {
          price: 1500, // BLUE day peak
          currency: 'EUR',
          day_type: 'BLUE',
          hour_slots: '06:00,06:30,07:00,16:00,16:30,17:00',
        },
        {
          price: 1000, // BLUE day off-peak
          currency: 'EUR',
          day_type: 'BLUE',
          hour_slots: '00:00,00:30,01:00,22:00,22:30,23:00,23:30',
        },
        {
          price: 2500, // RED day peak
          currency: 'EUR',
          day_type: 'RED',
          hour_slots: '06:00,06:30,07:00,16:00,16:30,17:00',
        },
      ];
      const consumptionDate = new Date('2023-10-15T14:30:00.000Z'); // 16:30 Paris time
      const consumptionValue = 10;
      const systemTimezone = 'Europe/Paris';
      const edfTempoHistoricalMap = new Map();
      edfTempoHistoricalMap.set('2023-10-15', 'BLUE');

      const cost = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.EDF_TEMPO](
        energyPricesAtConsumptionDate,
        consumptionDate,
        consumptionValue,
        systemTimezone,
        { edfTempoHistoricalMap },
      );

      expect(cost).to.equal(1.5); // 0.1500 * 10 = 1.5 EUR (BLUE day peak price)
    });
  });

  describe('ENERCOOP_NUIT_WEEKEND contract', () => {
    const publicHolidaysSet = new Set(['2025-05-01']);
    const energyPrices = [
      { price: 1000, currency: 'EUR', rate_type: 'off_peak' },
      { price: 1500, currency: 'EUR', rate_type: 'peak' },
    ];

    it('should use off-peak price at night on weekdays', async () => {
      const cost = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.ENERCOOP_NUIT_WEEKEND](
        energyPrices,
        new Date('2025-03-10T22:30:00.000Z'),
        10,
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(cost).to.equal(1.0);
    });

    it('should use peak price during daytime on weekdays', async () => {
      const cost = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.ENERCOOP_NUIT_WEEKEND](
        energyPrices,
        new Date('2025-03-10T10:00:00.000Z'),
        10,
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(cost).to.equal(1.5);
    });

    it('should use off-peak price on public holidays', async () => {
      const cost = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.ENERCOOP_NUIT_WEEKEND](
        energyPrices,
        new Date('2025-05-01T14:00:00.000Z'),
        10,
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(cost).to.equal(1.0);
    });
  });

  describe('ENERCOOP_2_SAISONS contract', () => {
    const publicHolidaysSet = new Set();
    const energyPrices = [
      { price: 900, currency: 'EUR', rate_type: 'off_peak' },
      { price: 1400, currency: 'EUR', rate_type: 'peak' },
    ];

    it('should use summer off-peak slots in July', async () => {
      const cost = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.ENERCOOP_2_SAISONS](
        energyPrices,
        new Date('2025-07-15T12:00:00.000Z'),
        10,
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(cost).to.be.closeTo(0.9, 0.0001);
    });

    it('should use winter off-peak slots in March', async () => {
      const cost = await contractsCalculateCost[ENERGY_CONTRACT_TYPES.ENERCOOP_2_SAISONS](
        energyPrices,
        new Date('2025-03-10T14:00:00.000Z'),
        10,
        'Europe/Paris',
        { publicHolidaysSet },
      );
      expect(cost).to.be.closeTo(0.9, 0.0001);
    });
  });
});
