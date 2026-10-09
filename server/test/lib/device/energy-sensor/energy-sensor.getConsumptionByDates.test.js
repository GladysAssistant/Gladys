const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const Promise = require('bluebird');

const db = require('../../../../models');
const EnergySensorManager = require('../../../../lib/device/energy-sensor');
const {
  buildOffsetDateExpression,
  shouldOffsetPeriods,
  buildDisplayPeriods,
} = require('../../../../lib/device/energy-sensor/energy-sensor.getConsumptionByDates');

// Extend Day.js with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const insertConsumptionStates = async (deviceFeatureId, numberOfDays) => {
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = numberOfDays * 48; // 48 states per day (every 30 minutes)

  for (let i = 0; i < statesToInsert; i += 1) {
    const date = new Date(now.getTime() - numberOfDays * 24 * 60 * 60 * 1000 + i * 30 * 60 * 1000);
    deviceFeatureStateToInsert.push({
      value: Math.random() * 10, // Random consumption value between 0 and 10
      created_at: date,
    });
  }
  await db.duckDbBatchInsertState(deviceFeatureId, deviceFeatureStateToInsert);
};

const TEST_SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';

const createdMeters = [];
const createMeter = async (deviceId, name) => {
  createdMeters.push(deviceId);
  return db.Device.create({ id: deviceId, name, selector: name, external_id: name, service_id: TEST_SERVICE_ID });
};

// a contract of the meter with a monthly subscription (amount per month), energy at 0.2
const createContract = (deviceId, overrides = {}) =>
  db.EnergyContract.create({
    selector: `contract-${deviceId}`,
    name: 'Base',
    electric_meter_device_id: deviceId,
    valid_from: '2023-01-01',
    valid_to: null,
    currency: 'EUR',
    timezone: 'UTC',
    tariff: {
      tariff_version: 1,
      components: [
        { key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } },
        { key: 'subscription', kind: 'fixed', amount: 15, per: 'month' },
      ],
    },
    ...overrides,
  });

const costFeatureStateManager = (deviceFeatureId, deviceId) => ({
  get: fake((type) => {
    if (type === 'deviceFeature') {
      return {
        id: deviceFeatureId,
        name: 'Energy Cost',
        device_id: deviceId,
        category: 'energy-sensor',
        type: 'thirty-minutes-consumption-cost',
        unit: 'euro',
      };
    }
    if (type === 'deviceById') {
      return { id: deviceId, name: 'Smart Meter' };
    }
    return null;
  }),
});

describe('EnergySensorManager.getConsumptionByDates', function Describe() {
  this.timeout(15000);

  let clock;

  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    await db.EnergyContract.destroy({ where: {} });

    clock = sinon.useFakeTimers({
      now: new Date('2023-10-15T12:00:00.000Z').getTime(),
    });
  });

  afterEach(() => {
    clock.restore();
  });

  describe('Basic functionality', () => {
    it('should return consumption data for a single device feature', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      await insertConsumptionStates(deviceFeatureId, 7);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: deviceFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'day',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      expect(results[0]).to.have.property('device');
      expect(results[0].device).to.have.property('name', 'Smart Meter');
      expect(results[0]).to.have.property('deviceFeature');
      expect(results[0].deviceFeature).to.have.property('name', 'Energy Consumption');
      expect(results[0]).to.have.property('values');
      expect(results[0].values).to.be.an('array');
    });

    it('should return consumption data for multiple device features', async () => {
      const deviceFeatureId1 = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceFeatureId2 = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e5';

      await insertConsumptionStates(deviceFeatureId1, 7);
      await insertConsumptionStates(deviceFeatureId2, 7);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            if (selector === 'test-device-feature-1') {
              return {
                id: deviceFeatureId1,
                name: 'Energy Consumption 1',
                device_id: 'device-1',
              };
            }
            if (selector === 'test-device-feature-2') {
              return {
                id: deviceFeatureId2,
                name: 'Energy Consumption 2',
                device_id: 'device-2',
              };
            }
          }
          if (type === 'deviceById') {
            if (selector === 'device-1') {
              return { name: 'Smart Meter 1' };
            }
            if (selector === 'device-2') {
              return { name: 'Smart Meter 2' };
            }
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(
        ['test-device-feature-1', 'test-device-feature-2'],
        { from, to, group_by: 'day' },
      );

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(2);
      expect(results[0].device.name).to.equal('Smart Meter 1');
      expect(results[1].device.name).to.equal('Smart Meter 2');
    });
  });

  describe('Date range validation', () => {
    it('should throw error when "from" date is after "to" date', async () => {
      const stateManager = {
        get: fake.returns({
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          name: 'Energy Consumption',
          device_id: 'device-1',
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-15T00:00:00.000Z');
      const to = new Date('2023-10-08T00:00:00.000Z');

      const promise = energySensorManager.getConsumptionByDates(['test-device-feature'], { from, to, group_by: 'day' });

      return assert.isRejected(promise, '"from" date must be before "to" date');
    });

    it('should throw error when "from" date equals "to" date', async () => {
      const stateManager = {
        get: fake.returns({
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          name: 'Energy Consumption',
          device_id: 'device-1',
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-15T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const promise = energySensorManager.getConsumptionByDates(['test-device-feature'], { from, to, group_by: 'day' });

      return assert.isRejected(promise, '"from" date must be before "to" date');
    });
  });

  describe('Group by functionality', () => {
    const GROUPS = [
      {
        period: 'hour',
        numberOfDays: 2,
        expectedMinResults: 1,
      },
      {
        period: 'day',
        numberOfDays: 7,
        expectedMinResults: 1,
      },
      {
        period: 'week',
        numberOfDays: 21,
        expectedMinResults: 1,
      },
      {
        period: 'month',
        numberOfDays: 60,
        expectedMinResults: 1,
      },
      {
        period: 'year',
        numberOfDays: 365,
        expectedMinResults: 1,
      },
    ];

    GROUPS.forEach((group) => {
      it(`should group consumption data by ${group.period}`, async () => {
        const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
        await insertConsumptionStates(deviceFeatureId, group.numberOfDays);

        const stateManager = {
          get: fake((type, selector) => {
            if (type === 'deviceFeature') {
              return {
                id: deviceFeatureId,
                name: 'Energy Consumption',
                device_id: 'device-1',
              };
            }
            if (type === 'deviceById') {
              return {
                name: 'Smart Meter',
              };
            }
            return null;
          }),
        };

        const energySensorManager = new EnergySensorManager(stateManager);

        const from = new Date(Date.now() - group.numberOfDays * 24 * 60 * 60 * 1000);
        const to = new Date();

        const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
          from,
          to,
          group_by: group.period,
        });

        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf(1);
        expect(results[0].values).to.be.an('array');
        expect(results[0].values.length).to.be.at.least(group.expectedMinResults);

        // Verify each value has the expected properties
        results[0].values.forEach((value) => {
          expect(value).to.have.property('created_at');
          expect(value).to.have.property('value');
          expect(value).to.have.property('max_value');
          expect(value).to.have.property('min_value');
          expect(value).to.have.property('sum_value');
          expect(value).to.have.property('count_value');
          expect(value.count_value).to.be.a('number');
        });
      });
    });

    it('should throw error for invalid group_by parameter', async () => {
      const stateManager = {
        get: fake.returns({
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          name: 'Energy Consumption',
          device_id: 'device-1',
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const promise = energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'invalid',
      });

      return assert.isRejected(promise, 'Invalid groupBy parameter. Must be one of: hour, day, week, month, year');
    });

    it('should work without group_by parameter (null)', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      await insertConsumptionStates(deviceFeatureId, 7);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: deviceFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], { from, to });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      expect(results[0].values).to.be.an('array');
    });
  });

  describe('Error handling', () => {
    it('should throw error when device feature is not found', async () => {
      const stateManager = {
        get: fake.returns(null),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const promise = energySensorManager.getConsumptionByDates(['non-existent-feature'], {
        from,
        to,
        group_by: 'day',
      });

      return assert.isRejected(promise, 'DeviceFeature not found');
    });
  });

  describe('Timezone handling', () => {
    it('should handle timezone offset correctly', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

      // Insert states with specific timestamps
      const states = [];
      const baseDate = new Date('2023-10-10T00:00:00.000Z');
      for (let i = 0; i < 24; i += 1) {
        states.push({
          value: i,
          created_at: new Date(baseDate.getTime() + i * 60 * 60 * 1000),
        });
      }
      await db.duckDbBatchInsertState(deviceFeatureId, states);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: deviceFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-11T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'hour',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      expect(results[0].values).to.be.an('array');
      expect(results[0].values.length).to.be.at.least(1);
    });
  });

  describe('Data aggregation', () => {
    it('should correctly aggregate consumption values', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

      // Insert known values for verification
      const states = [];
      const baseDate = new Date('2023-10-10T00:00:00.000Z');
      const values = [5, 10, 15, 20, 25];

      values.forEach((value, index) => {
        states.push({
          value,
          created_at: new Date(baseDate.getTime() + index * 60 * 60 * 1000),
        });
      });

      await db.duckDbBatchInsertState(deviceFeatureId, states);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: deviceFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-11T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'day',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      expect(results[0].values).to.be.an('array');

      if (results[0].values.length > 0) {
        const aggregatedValue = results[0].values[0];
        expect(aggregatedValue.min_value).to.equal(5);
        expect(aggregatedValue.max_value).to.equal(25);
        expect(aggregatedValue.sum_value).to.equal(75);
        expect(aggregatedValue.count_value).to.equal(5);
        expect(aggregatedValue.value).to.equal(15); // Average
      }
    });
  });

  describe('Response format', () => {
    it('should return data in the correct format with created_at field', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      await insertConsumptionStates(deviceFeatureId, 7);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: deviceFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'day',
      });

      expect(results[0].values).to.be.an('array');

      results[0].values.forEach((value) => {
        // Should have created_at (renamed from grouped_date)
        expect(value).to.have.property('created_at');
        expect(value).to.not.have.property('grouped_date');

        // Should have all aggregation fields
        expect(value).to.have.property('value');
        expect(value).to.have.property('max_value');
        expect(value).to.have.property('min_value');
        expect(value).to.have.property('sum_value');
        expect(value).to.have.property('count_value');

        // count_value should be a number
        expect(value.count_value).to.be.a('number');
      });
    });
  });

  describe('Concurrency', () => {
    it('should process multiple selectors with concurrency limit', async () => {
      const deviceFeatureIds = [
        'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e5',
        'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e6',
        'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e7',
        'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e8',
      ];

      // Insert data for all features
      await Promise.map(deviceFeatureIds, (id) => insertConsumptionStates(id, 7));

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            const index = parseInt(selector.split('-').pop(), 10);
            return {
              id: deviceFeatureIds[index],
              name: `Energy Consumption ${index}`,
              device_id: `device-${index}`,
            };
          }
          if (type === 'deviceById') {
            const index = parseInt(selector.split('-').pop(), 10);
            return {
              name: `Smart Meter ${index}`,
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const selectors = deviceFeatureIds.map((id, index) => `test-device-feature-${index}`);

      const results = await energySensorManager.getConsumptionByDates(selectors, { from, to, group_by: 'day' });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(5);

      results.forEach((result, index) => {
        expect(result.device.name).to.equal(`Smart Meter ${index}`);
        expect(result.deviceFeature.name).to.equal(`Energy Consumption ${index}`);
        expect(result.values).to.be.an('array');
      });
    });
  });

  describe('Display mode', () => {
    it('should hot-replace cost feature with consumption feature when display_mode is kwh', async () => {
      const costFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const consumptionFeatureId = 'ba91dfdf-55b2-4cf8-a58b-99c0fbf6f5e5';

      // Insert states for consumption feature
      await db.duckDbBatchInsertState(consumptionFeatureId, [
        { value: 1.5, created_at: new Date('2023-10-10T01:00:00.000Z') },
        { value: 2.0, created_at: new Date('2023-10-10T02:00:00.000Z') },
      ]);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature' && selector === 'cost-feature-selector') {
            return {
              id: costFeatureId,
              name: 'Energy Cost',
              device_id: 'device-1',
              category: 'energy-sensor',
              type: 'thirty-minutes-consumption-cost',
              energy_parent_id: consumptionFeatureId,
              unit: 'euro',
            };
          }
          if (type === 'deviceFeatureById' && selector === consumptionFeatureId) {
            return {
              id: consumptionFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
              category: 'energy-sensor',
              type: 'thirty-minutes-consumption',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-11T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['cost-feature-selector'], {
        from,
        to,
        group_by: 'hour',
        display_mode: 'kwh',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      // Should use consumption feature name, not cost feature name
      expect(results[0].deviceFeature.name).to.equal('Energy Consumption');
      // Should return the currency unit from the original cost feature
      expect(results[0].deviceFeature.currency_unit).to.equal('euro');
      expect(results[0].values).to.be.an('array');
      expect(results[0].values.length).to.be.at.least(1);
    });

    it('should use cost feature when display_mode is currency (default)', async () => {
      const costFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

      // Insert states for cost feature
      await db.duckDbBatchInsertState(costFeatureId, [
        { value: 0.15, created_at: new Date('2023-10-10T01:00:00.000Z') },
        { value: 0.2, created_at: new Date('2023-10-10T02:00:00.000Z') },
      ]);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: costFeatureId,
              name: 'Energy Cost',
              device_id: 'device-1',
              category: 'energy-sensor',
              type: 'thirty-minutes-consumption-cost',
              energy_parent_id: 'some-consumption-feature-id',
              unit: 'dollar',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-11T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['cost-feature-selector'], {
        from,
        to,
        group_by: 'hour',
        display_mode: 'currency',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      // Should use cost feature name
      expect(results[0].deviceFeature.name).to.equal('Energy Cost');
      // Should return the currency unit from the cost feature
      expect(results[0].deviceFeature.currency_unit).to.equal('dollar');
      expect(results[0].values).to.be.an('array');
    });

    it('should not replace feature when display_mode is kwh but feature is not a cost feature', async () => {
      const consumptionFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

      await db.duckDbBatchInsertState(consumptionFeatureId, [
        { value: 1.5, created_at: new Date('2023-10-10T01:00:00.000Z') },
      ]);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: consumptionFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
              category: 'energy-sensor',
              type: 'thirty-minutes-consumption',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-11T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['consumption-feature-selector'], {
        from,
        to,
        group_by: 'hour',
        display_mode: 'kwh',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      // Should still use the consumption feature
      expect(results[0].deviceFeature.name).to.equal('Energy Consumption');
      // Should return null for currency_unit since this is not a cost feature
      expect(results[0].deviceFeature.currency_unit).to.equal(null);
    });

    it('should convert Wh to kWh when display_mode is kwh and unit is watt-hour', async () => {
      const consumptionFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

      // Insert states with values in Wh (1500 Wh = 1.5 kWh)
      await db.duckDbBatchInsertState(consumptionFeatureId, [
        { value: 1500, created_at: new Date('2023-10-10T01:00:00.000Z') },
        { value: 2000, created_at: new Date('2023-10-10T02:00:00.000Z') },
      ]);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: consumptionFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
              category: 'energy-sensor',
              type: 'thirty-minutes-consumption',
              unit: 'watt-hour',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-11T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['consumption-feature-selector'], {
        from,
        to,
        group_by: 'hour',
        display_mode: 'kwh',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      expect(results[0].values).to.be.an('array');
      expect(results[0].values.length).to.equal(2);
      // Values should be converted from Wh to kWh (divided by 1000)
      expect(results[0].values[0].sum_value).to.equal(1.5);
      expect(results[0].values[1].sum_value).to.equal(2);
    });

    it('should not convert when display_mode is kwh but unit is already kilowatt-hour', async () => {
      const consumptionFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

      // Insert states with values already in kWh
      await db.duckDbBatchInsertState(consumptionFeatureId, [
        { value: 1.5, created_at: new Date('2023-10-10T01:00:00.000Z') },
        { value: 2.0, created_at: new Date('2023-10-10T02:00:00.000Z') },
      ]);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: consumptionFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-1',
              category: 'energy-sensor',
              type: 'thirty-minutes-consumption',
              unit: 'kilowatt-hour',
            };
          }
          if (type === 'deviceById') {
            return {
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-11T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['consumption-feature-selector'], {
        from,
        to,
        group_by: 'hour',
        display_mode: 'kwh',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1);
      expect(results[0].values).to.be.an('array');
      expect(results[0].values.length).to.equal(2);
      // Values should NOT be converted (already in kWh)
      expect(results[0].values[0].sum_value).to.equal(1.5);
      expect(results[0].values[1].sum_value).to.equal(2);
    });
  });

  describe('Subscription prices', () => {
    const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

    const query = async (deviceId, options) => {
      const energySensorManager = new EnergySensorManager(costFeatureStateManager(deviceFeatureId, deviceId));
      energySensorManager.getRootElectricMeterDevice = () => ({ id: deviceFeatureId, device_id: deviceId });
      return energySensorManager.getConsumptionByDates(['test-device-feature'], {
        display_mode: 'currency',
        ...options,
      });
    };
    const subscriptionOf = (results) => results.find((r) => r.deviceFeature.is_subscription === true);

    afterEach(async () => {
      await db.EnergyContract.destroy({ where: {} });
      await db.Device.destroy({ where: { id: createdMeters.splice(0) } });
    });

    it('should add the subscription of the meter contract as a separate series, per day', async () => {
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e1';
      await insertConsumptionStates(deviceFeatureId, 7);
      await createMeter(deviceId, 'sub-meter-day');
      await createContract(deviceId, { name: 'Blue contract' });
      const results = await query(deviceId, {
        from: new Date('2023-10-08T00:00:00.000Z'),
        to: new Date('2023-10-15T00:00:00.000Z'),
        group_by: 'day',
      });
      expect(results).to.have.lengthOf(2); // 1 subscription (first) + 1 consumption
      const subscription = results[0];
      expect(subscription.deviceFeature).to.deep.equal({
        name: 'Blue contract',
        currency_unit: 'euro',
        is_subscription: true,
      });
      expect(subscription.device.name).to.equal('Smart Meter');
      expect(subscription.values).to.have.lengthOf(7);
      // 15 per month over the 31 days of October
      subscription.values.forEach((value) => {
        expect(value.sum_value).to.be.closeTo(15 / 31, 1e-6);
        expect(value.value).to.equal(value.sum_value);
        expect(value.contract_name).to.equal('Blue contract');
      });
      expect(subscription.values[0].created_at).to.equal('2023-10-08T00:00:00.000Z');
      // the consumption series carries no subscription
      expect(results[1].deviceFeature.is_subscription).to.equal(undefined);
    });

    it('should follow a contract change, a gap without contract and a foreign timezone', async () => {
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e2';
      await insertConsumptionStates(deviceFeatureId, 30);
      await createMeter(deviceId, 'sub-meter-change');
      // 12 per month until Oct 10 (Paris), nothing on Oct 11, 18 per month from Oct 12 (Paris)
      await createContract(deviceId, {
        selector: 'old-contract',
        name: 'Old contract',
        timezone: 'Europe/Paris',
        valid_to: '2023-10-10',
        tariff: { tariff_version: 1, components: [{ key: 's', kind: 'fixed', amount: 12, per: 'month' }] },
      });
      await createContract(deviceId, {
        selector: 'new-contract',
        name: 'New contract',
        timezone: 'Europe/Paris',
        valid_from: '2023-10-12',
        tariff: { tariff_version: 1, components: [{ key: 's', kind: 'fixed', amount: 18, per: 'month' }] },
      });
      const results = await query(deviceId, {
        from: new Date('2023-10-09T00:00:00.000Z'),
        to: new Date('2023-10-14T00:00:00.000Z'),
        group_by: 'day',
      });
      const subscription = subscriptionOf(results);
      expect(subscription.deviceFeature.name).to.equal('Old contract');
      const byDay = Object.fromEntries(subscription.values.map((v) => [v.created_at.slice(0, 10), v]));
      // the monthly amount is spread over the real duration of October in Paris: 745 hours (DST end)
      const hourOfMonth = 1 / 745;
      // a UTC day starts at 02:00 Paris: Oct 9 is fully in the old contract
      expect(byDay['2023-10-09'].sum_value).to.be.closeTo(12 * 24 * hourOfMonth, 1e-5);
      // Oct 10 UTC: the old contract until midnight Paris (22 h), nothing after
      expect(byDay['2023-10-10'].sum_value).to.be.closeTo(12 * 22 * hourOfMonth, 1e-5);
      expect(byDay['2023-10-10'].contract_name).to.equal('Old contract');
      // Oct 11 UTC: nothing until 22:00 UTC, then the new contract
      expect(byDay['2023-10-11'].sum_value).to.be.closeTo(18 * 2 * hourOfMonth, 1e-5);
      expect(byDay['2023-10-11'].contract_name).to.equal('New contract');
      expect(byDay['2023-10-12'].sum_value).to.be.closeTo(18 * 24 * hourOfMonth, 1e-5);
    });

    it('should return no subscription series without contract, without fixed component or in kwh mode', async () => {
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e3';
      await insertConsumptionStates(deviceFeatureId, 7);
      await createMeter(deviceId, 'sub-meter-none');
      const options = {
        from: new Date('2023-10-08T00:00:00.000Z'),
        to: new Date('2023-10-15T00:00:00.000Z'),
        group_by: 'day',
      };
      expect(subscriptionOf(await query(deviceId, options))).to.equal(undefined);
      await createContract(deviceId, {
        tariff: {
          tariff_version: 1,
          components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } }],
        },
      });
      expect(subscriptionOf(await query(deviceId, options))).to.equal(undefined);
      await db.EnergyContract.destroy({ where: {} });
      await createContract(deviceId);
      expect(subscriptionOf(await query(deviceId, { ...options, display_mode: 'kwh' }))).to.equal(undefined);
    });

    it('should show no subscription for the periods without consumption data', async () => {
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      await insertConsumptionStates(deviceFeatureId, 2);
      await createMeter(deviceId, 'sub-meter-range');
      await createContract(deviceId);
      // data covers Oct 13 to Oct 15: the earlier days of the range get no subscription
      const results = await query(deviceId, {
        from: new Date('2023-10-08T00:00:00.000Z'),
        to: new Date('2023-10-15T00:00:00.000Z'),
        group_by: 'day',
      });
      const subscription = subscriptionOf(results);
      expect(subscription.values.map((v) => v.created_at.slice(0, 10))).to.deep.equal(['2023-10-13', '2023-10-14']);
      // no consumption at all: no subscription series
      await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
      expect(
        subscriptionOf(
          await query(deviceId, {
            from: new Date('2023-10-08T00:00:00.000Z'),
            to: new Date('2023-10-15T00:00:00.000Z'),
            group_by: 'day',
          }),
        ),
      ).to.equal(undefined);
    });

    it('should use the meter of the feature when the root meter is unknown', async () => {
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e5';
      await insertConsumptionStates(deviceFeatureId, 7);
      await createMeter(deviceId, 'sub-meter-root');
      await createContract(deviceId);
      const energySensorManager = new EnergySensorManager(costFeatureStateManager(deviceFeatureId, deviceId));
      energySensorManager.getRootElectricMeterDevice = () => null;
      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2023-10-08T00:00:00.000Z'),
        to: new Date('2023-10-15T00:00:00.000Z'),
        group_by: 'day',
      });
      expect(subscriptionOf(results).values).to.have.lengthOf(7);
    });

    it('should spread the subscription per hour, week, month, year and billing period', async () => {
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e6';
      await insertConsumptionStates(deviceFeatureId, 400);
      await createMeter(deviceId, 'sub-meter-groups');
      await createContract(deviceId, { valid_from: '2022-01-01' });
      const hour = subscriptionOf(
        await query(deviceId, {
          from: new Date('2023-10-14T00:00:00.000Z'),
          to: new Date('2023-10-14T06:00:00.000Z'),
          group_by: 'hour',
        }),
      );
      expect(hour.values).to.have.lengthOf(6);
      expect(hour.values[0].sum_value).to.be.closeTo(15 / 31 / 24, 1e-6);
      const week = subscriptionOf(
        await query(deviceId, {
          from: new Date('2023-10-01T00:00:00.000Z'),
          to: new Date('2023-10-15T00:00:00.000Z'),
          group_by: 'week',
        }),
      );
      expect(week.values).to.have.lengthOf(2);
      expect(week.values[0].sum_value).to.be.closeTo((15 / 31) * 7, 1e-6);
      const month = subscriptionOf(
        await query(deviceId, {
          from: new Date('2023-08-01T00:00:00.000Z'),
          to: new Date('2023-10-01T00:00:00.000Z'),
          group_by: 'month',
        }),
      );
      // each day is priced by the engine and rounded to 6 decimals: a month sums 30 of them
      expect(month.values).to.have.lengthOf(2);
      month.values.forEach((v) => expect(v.sum_value).to.be.closeTo(15, 1e-4));
      const year = subscriptionOf(
        await query(deviceId, {
          from: new Date('2022-01-01T00:00:00.000Z'),
          to: new Date('2023-01-01T00:00:00.000Z'),
          group_by: 'year',
        }),
      );
      expect(year.values).to.have.lengthOf(1);
      expect(year.values[0].sum_value).to.be.closeTo(15 * 12, 1e-3);
      // a billing period starting on the 5th: from the 5th to the 5th (Sep 5 to Oct 5 = 30 days)
      const billingResults = await query(deviceId, {
        from: new Date('2023-09-05T00:00:00.000Z'),
        to: new Date('2023-10-05T00:00:00.000Z'),
        group_by: 'month',
        period_start_day: 5,
      });
      const billing = subscriptionOf(billingResults);
      expect(billing.values).to.have.lengthOf(1);
      expect(billing.values[0].created_at).to.equal('2023-09-05T00:00:00.000Z');
      // 26 days of September (15/30 a day) and 4 days of October (15/31 a day)
      expect(billing.values[0].sum_value).to.be.closeTo(26 * (15 / 30) + 4 * (15 / 31), 1e-4);
      // without group_by: daily periods
      // without group_by the consumption is one undated aggregate: nothing to align the subscription on
      const ungrouped = await query(deviceId, {
        from: new Date('2023-10-08T00:00:00.000Z'),
        to: new Date('2023-10-15T00:00:00.000Z'),
      });
      expect(subscriptionOf(ungrouped)).to.equal(undefined);
    });

    describe('buildDisplayPeriods', () => {
      it('should derive the offset periods from the range start, clamped like the SQL', () => {
        const periods = buildDisplayPeriods(
          new Date('2023-01-31T00:00:00.000Z'),
          new Date('2023-04-30T00:00:00.000Z'),
          'month',
          31,
        );
        expect(periods.map((p) => p.starts_at)).to.deep.equal([
          '2023-01-31T00:00:00.000Z',
          '2023-02-28T00:00:00.000Z',
          '2023-03-31T00:00:00.000Z',
        ]);
        expect(periods[1].ends_at).to.equal('2023-03-31T00:00:00.000Z');
        expect(periods[0].created_at).to.equal(periods[0].starts_at);
      });
      it('should fall back to daily periods for an unknown grouping', () => {
        const periods = buildDisplayPeriods(
          new Date('2023-01-01T00:00:00.000Z'),
          new Date('2023-01-03T00:00:00.000Z'),
          null,
          1,
        );
        expect(periods).to.have.lengthOf(2);
      });
    });
  });

  describe('Billing period start day', () => {
    const DEVICE_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e7';

    const buildStateManager = () => ({
      get: fake((type) => {
        if (type === 'deviceFeature') {
          return {
            id: DEVICE_FEATURE_ID,
            name: 'Energy Consumption',
            device_id: 'device-1',
          };
        }
        if (type === 'deviceById') {
          return {
            name: 'Smart Meter',
          };
        }
        return null;
      }),
    });

    const insertStatesAtDates = async (dates) => {
      await db.duckDbBatchInsertState(
        DEVICE_FEATURE_ID,
        dates.map((date) => ({ value: 1, created_at: new Date(date) })),
      );
    };

    // The tests run with the process timezone (UTC in CI), which is also the
    // DuckDB session timezone: period boundaries are at midnight UTC.
    const bucketDates = (values) => values.map((value) => new Date(value.created_at).toISOString());

    it('should group months on the billing start day', async () => {
      await insertStatesAtDates([
        '2023-01-05T00:00:00.000Z',
        '2023-01-20T10:00:00.000Z',
        '2023-02-04T23:00:00.000Z',
        '2023-02-05T00:00:00.000Z',
        '2023-03-01T10:00:00.000Z',
      ]);

      const energySensorManager = new EnergySensorManager(buildStateManager());

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2023-01-05T00:00:00.000Z'),
        to: new Date('2023-03-05T00:00:00.000Z'),
        group_by: 'month',
        display_mode: 'kwh',
        period_start_day: 5,
      });

      expect(bucketDates(results[0].values)).to.deep.equal(['2023-01-05T00:00:00.000Z', '2023-02-05T00:00:00.000Z']);
      // 5th of January, 20th of January and 4th of February are in the first period
      expect(results[0].values[0].count_value).to.equal(3);
      expect(results[0].values[1].count_value).to.equal(2);
    });

    it('should keep calendar months when the start day is 1', async () => {
      await insertStatesAtDates([
        '2023-01-05T00:00:00.000Z',
        '2023-01-20T10:00:00.000Z',
        '2023-02-04T23:00:00.000Z',
        '2023-02-05T00:00:00.000Z',
      ]);

      const energySensorManager = new EnergySensorManager(buildStateManager());

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2023-01-01T00:00:00.000Z'),
        to: new Date('2023-03-01T00:00:00.000Z'),
        group_by: 'month',
        display_mode: 'kwh',
        period_start_day: 1,
      });

      expect(bucketDates(results[0].values)).to.deep.equal(['2023-01-01T00:00:00.000Z', '2023-02-01T00:00:00.000Z']);
      expect(results[0].values[0].count_value).to.equal(2);
      expect(results[0].values[1].count_value).to.equal(2);
    });

    it('should start the period on the last day of the month when the month is too short', async () => {
      await insertStatesAtDates([
        '2023-01-31T00:00:00.000Z',
        '2023-02-27T10:00:00.000Z',
        '2023-02-28T00:00:00.000Z',
        '2023-03-30T10:00:00.000Z',
      ]);

      const energySensorManager = new EnergySensorManager(buildStateManager());

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2023-01-31T00:00:00.000Z'),
        to: new Date('2023-03-31T00:00:00.000Z'),
        group_by: 'month',
        display_mode: 'kwh',
        period_start_day: 31,
      });

      // February 2023 has 28 days: the period starts on the 28th
      expect(bucketDates(results[0].values)).to.deep.equal(['2023-01-31T00:00:00.000Z', '2023-02-28T00:00:00.000Z']);
      expect(results[0].values[0].count_value).to.equal(2);
      expect(results[0].values[1].count_value).to.equal(2);
    });

    it('should start the period on the 29th of February on a leap year', async () => {
      await insertStatesAtDates([
        '2024-01-31T00:00:00.000Z',
        '2024-02-28T10:00:00.000Z',
        '2024-02-29T00:00:00.000Z',
        '2024-03-15T10:00:00.000Z',
      ]);

      const energySensorManager = new EnergySensorManager(buildStateManager());

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2024-01-31T00:00:00.000Z'),
        to: new Date('2024-03-31T00:00:00.000Z'),
        group_by: 'month',
        display_mode: 'kwh',
        period_start_day: 31,
      });

      expect(bucketDates(results[0].values)).to.deep.equal(['2024-01-31T00:00:00.000Z', '2024-02-29T00:00:00.000Z']);
      expect(results[0].values[0].count_value).to.equal(2);
      expect(results[0].values[1].count_value).to.equal(2);
    });

    it('should group years on the billing start day', async () => {
      await insertStatesAtDates([
        '2023-01-05T00:00:00.000Z',
        '2023-06-15T10:00:00.000Z',
        '2024-01-04T23:00:00.000Z',
        '2024-01-05T00:00:00.000Z',
        '2024-06-15T10:00:00.000Z',
      ]);

      const energySensorManager = new EnergySensorManager(buildStateManager());

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2023-01-05T00:00:00.000Z'),
        to: new Date('2025-01-05T00:00:00.000Z'),
        group_by: 'year',
        display_mode: 'kwh',
        period_start_day: 5,
      });

      expect(bucketDates(results[0].values)).to.deep.equal(['2023-01-05T00:00:00.000Z', '2024-01-05T00:00:00.000Z']);
      // 5th of January 2023, 15th of June 2023 and 4th of January 2024 are in the first period
      expect(results[0].values[0].count_value).to.equal(3);
      expect(results[0].values[1].count_value).to.equal(2);
    });

    it('should not change daily buckets', async () => {
      await insertStatesAtDates(['2023-01-05T00:00:00.000Z', '2023-01-05T10:00:00.000Z', '2023-01-06T10:00:00.000Z']);

      const energySensorManager = new EnergySensorManager(buildStateManager());

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2023-01-05T00:00:00.000Z'),
        to: new Date('2023-01-07T00:00:00.000Z'),
        group_by: 'day',
        display_mode: 'kwh',
        period_start_day: 5,
      });

      expect(bucketDates(results[0].values)).to.deep.equal(['2023-01-05T00:00:00.000Z', '2023-01-06T00:00:00.000Z']);
    });

    it('should throw an error when the start day is not a valid day of month', async () => {
      const energySensorManager = new EnergySensorManager(buildStateManager());

      const promise = energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2023-01-05T00:00:00.000Z'),
        to: new Date('2023-02-05T00:00:00.000Z'),
        group_by: 'month',
        period_start_day: 32,
      });

      return assert.isRejected(promise, '"period_start_day" must be an integer between 1 and 31');
    });

    it('should throw an error when the start day is not a number', async () => {
      const energySensorManager = new EnergySensorManager(buildStateManager());

      const promise = energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from: new Date('2023-01-05T00:00:00.000Z'),
        to: new Date('2023-02-05T00:00:00.000Z'),
        group_by: 'month',
        period_start_day: 'not-a-day',
      });

      return assert.isRejected(promise, '"period_start_day" must be an integer between 1 and 31');
    });

    describe('shouldOffsetPeriods', () => {
      it('should not offset when the start day is the 1st', () => {
        expect(shouldOffsetPeriods('month', 1)).to.equal(false);
        expect(shouldOffsetPeriods('year', 1)).to.equal(false);
      });
      it('should not offset hourly, daily and weekly buckets', () => {
        expect(shouldOffsetPeriods('hour', 5)).to.equal(false);
        expect(shouldOffsetPeriods('day', 5)).to.equal(false);
        expect(shouldOffsetPeriods('week', 5)).to.equal(false);
        expect(shouldOffsetPeriods(null, 5)).to.equal(false);
      });
      it('should offset monthly and yearly buckets', () => {
        expect(shouldOffsetPeriods('month', 5)).to.equal(true);
        expect(shouldOffsetPeriods('year', 5)).to.equal(true);
      });
    });

    describe('buildOffsetDateExpression', () => {
      it('should build a yearly expression', () => {
        expect(buildOffsetDateExpression('year', 5)).to.contain("DATE_TRUNC('year', created_at)");
        expect(buildOffsetDateExpression('year', 5)).to.contain('TO_DAYS(4)');
      });
      it('should build a monthly expression', () => {
        expect(buildOffsetDateExpression('month', 5)).to.contain("DATE_TRUNC('month', created_at)");
        expect(buildOffsetDateExpression('month', 5)).to.contain('LEAST(5,');
      });
    });
  });
});
