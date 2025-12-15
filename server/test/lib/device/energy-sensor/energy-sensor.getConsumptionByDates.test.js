const { expect, assert } = require('chai');
const { fake } = require('sinon');
const sinon = require('sinon');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const Promise = require('bluebird');

const db = require('../../../../models');
const EnergySensorManager = require('../../../../lib/device/energy-sensor');

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

describe('EnergySensorManager.getConsumptionByDates', function Describe() {
  this.timeout(15000);

  let clock;

  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');

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
    it('should return subscription prices when available', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e1';

      await insertConsumptionStates(deviceFeatureId, 7);

      // Create a device first (required for foreign key)
      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter',
        selector: 'test-smart-meter-1',
        external_id: 'test-smart-meter-1',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      // Create a subscription price in the database
      await db.EnergyPrice.create({
        id: 'price-sub-1',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000, // 15€/month (stored as integer, divide by 10000)
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        selector: 'test-subscription-price-1',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
            return {
              id: deviceId,
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      // Mock getRootElectricMeterDevice to return the feature itself
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'day',
        display_mode: 'currency',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(2); // 1 consumption + 1 subscription

      // Find the subscription result
      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      expect(subscriptionResult.deviceFeature.is_subscription).to.equal(true);
      expect(subscriptionResult.values).to.be.an('array');
      expect(subscriptionResult.values.length).to.equal(7); // 7 days
      expect(subscriptionResult.values[0]).to.have.property('sum_value');
      expect(subscriptionResult.values[0]).to.have.property('created_at');

      // Price is 15€/month, October has 31 days, so daily price = 15/31 ≈ 0.484
      const expectedDailyPrice = 15 / 31;
      expect(subscriptionResult.values[0].sum_value).to.be.closeTo(expectedDailyPrice, 0.01);

      // Cleanup
      await db.EnergyPrice.destroy({ where: { id: 'price-sub-1' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should handle contract changes during the period', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e2';

      await insertConsumptionStates(deviceFeatureId, 30);

      // Create a device first (required for foreign key)
      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter 2',
        selector: 'test-smart-meter-2',
        external_id: 'test-smart-meter-2',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      // Create two subscription prices with different dates
      await db.EnergyPrice.create({
        id: 'price-sub-2a',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 120000, // 12€/month
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: '2023-10-12',
        contract_name: 'Old Contract',
        selector: 'test-subscription-price-2a',
      });

      await db.EnergyPrice.create({
        id: 'price-sub-2b',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 180000, // 18€/month
        currency: 'EUR',
        start_date: '2023-10-13',
        end_date: null,
        contract_name: 'New Contract',
        selector: 'test-subscription-price-2b',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
            return {
              id: deviceId,
              name: 'Smart Meter',
            };
          }
          return null;
        }),
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-16T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'day',
        display_mode: 'currency',
      });

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(2); // 1 consumption + 1 subscription

      // Find the subscription result
      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      expect(subscriptionResult.values.length).to.equal(6); // 6 days

      // First 3 days (Oct 10-12) should use old contract (12€/month)
      const oldContractDailyPrice = 12 / 31;
      expect(subscriptionResult.values[0].sum_value).to.be.closeTo(oldContractDailyPrice, 0.01);
      expect(subscriptionResult.values[1].sum_value).to.be.closeTo(oldContractDailyPrice, 0.01);
      expect(subscriptionResult.values[2].sum_value).to.be.closeTo(oldContractDailyPrice, 0.01);

      // Last 3 days (Oct 13-15) should use new contract (18€/month)
      const newContractDailyPrice = 18 / 31;
      expect(subscriptionResult.values[3].sum_value).to.be.closeTo(newContractDailyPrice, 0.01);
      expect(subscriptionResult.values[4].sum_value).to.be.closeTo(newContractDailyPrice, 0.01);
      expect(subscriptionResult.values[5].sum_value).to.be.closeTo(newContractDailyPrice, 0.01);

      // Cleanup
      await db.EnergyPrice.destroy({ where: { id: ['price-sub-2a', 'price-sub-2b'] } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should return empty subscription array when no subscription prices exist', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

      await insertConsumptionStates(deviceFeatureId, 7);

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: deviceFeatureId,
              name: 'Energy Consumption',
              device_id: 'device-no-sub',
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
      expect(results).to.have.lengthOf(1); // Only consumption, no subscription

      // Verify no subscription item exists
      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.equal(undefined);
    });

    it('should calculate subscription prices grouped by hour', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

      await insertConsumptionStates(deviceFeatureId, 2);

      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter Hour',
        selector: 'test-smart-meter-hour',
        external_id: 'test-smart-meter-hour',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      await db.EnergyPrice.create({
        id: 'price-sub-hour',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000, // 15€/month
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        contract_name: 'Hourly Contract',
        selector: 'test-subscription-price-hour',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2023-10-10T00:00:00.000Z');
      const to = new Date('2023-10-10T06:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'hour',
        display_mode: 'currency',
      });

      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      expect(subscriptionResult.values.length).to.equal(6); // 6 hours

      // Price is 15€/month, October has 31 days, so hourly price = 15 / 31 / 24
      const expectedHourlyPrice = 15 / 31 / 24;
      expect(subscriptionResult.values[0].sum_value).to.be.closeTo(expectedHourlyPrice, 0.001);

      await db.EnergyPrice.destroy({ where: { id: 'price-sub-hour' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should calculate subscription prices grouped by week', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e5';

      await insertConsumptionStates(deviceFeatureId, 21);

      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter Week',
        selector: 'test-smart-meter-week',
        external_id: 'test-smart-meter-week',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      await db.EnergyPrice.create({
        id: 'price-sub-week',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000, // 15€/month
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        contract_name: 'Weekly Contract',
        selector: 'test-subscription-price-week',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2023-10-01T00:00:00.000Z');
      const to = new Date('2023-10-22T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'week',
        display_mode: 'currency',
      });

      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      expect(subscriptionResult.values.length).to.equal(3); // 3 weeks

      // Price is 15€/month, October has 31 days, weekly price = (15 / 31) * 7
      const expectedWeeklyPrice = (15 / 31) * 7;
      expect(subscriptionResult.values[0].sum_value).to.be.closeTo(expectedWeeklyPrice, 0.01);

      await db.EnergyPrice.destroy({ where: { id: 'price-sub-week' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should calculate subscription prices grouped by month', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e6';

      await insertConsumptionStates(deviceFeatureId, 60);

      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter Month',
        selector: 'test-smart-meter-month',
        external_id: 'test-smart-meter-month',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      await db.EnergyPrice.create({
        id: 'price-sub-month',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000, // 15€/month
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        contract_name: 'Monthly Contract',
        selector: 'test-subscription-price-month',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2023-09-01T00:00:00.000Z');
      const to = new Date('2023-11-01T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'month',
        display_mode: 'currency',
      });

      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      expect(subscriptionResult.values.length).to.equal(2); // 2 months

      // Price is 15€/month
      const expectedMonthlyPrice = 15;
      expect(subscriptionResult.values[0].sum_value).to.be.closeTo(expectedMonthlyPrice, 0.01);

      await db.EnergyPrice.destroy({ where: { id: 'price-sub-month' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should calculate subscription prices grouped by year', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e7';

      await insertConsumptionStates(deviceFeatureId, 365);

      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter Year',
        selector: 'test-smart-meter-year',
        external_id: 'test-smart-meter-year',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      await db.EnergyPrice.create({
        id: 'price-sub-year',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000, // 15€/month
        currency: 'EUR',
        start_date: '2022-01-01',
        end_date: null,
        contract_name: 'Yearly Contract',
        selector: 'test-subscription-price-year',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2022-01-01T00:00:00.000Z');
      const to = new Date('2024-01-01T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'year',
        display_mode: 'currency',
      });

      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      expect(subscriptionResult.values.length).to.equal(2); // 2 years

      // Price is 15€/month * 12 = 180€/year
      const expectedYearlyPrice = 15 * 12;
      expect(subscriptionResult.values[0].sum_value).to.be.closeTo(expectedYearlyPrice, 0.01);

      await db.EnergyPrice.destroy({ where: { id: 'price-sub-year' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should use default grouping when group_by is not specified for subscription', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e8';

      await insertConsumptionStates(deviceFeatureId, 7);

      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter Default',
        selector: 'test-smart-meter-default',
        external_id: 'test-smart-meter-default',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      await db.EnergyPrice.create({
        id: 'price-sub-default',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000, // 15€/month
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        contract_name: 'Default Contract',
        selector: 'test-subscription-price-default',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      // Note: not passing group_by, should use default 'day'
      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        display_mode: 'currency',
      });

      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      expect(subscriptionResult.values.length).to.equal(7); // 7 days (default grouping)

      await db.EnergyPrice.destroy({ where: { id: 'price-sub-default' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should fallback to feature name when contract_name is not set', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e9';

      await insertConsumptionStates(deviceFeatureId, 7);

      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter No Contract Name',
        selector: 'test-smart-meter-no-contract',
        external_id: 'test-smart-meter-no-contract',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      // Create subscription price WITHOUT contract_name
      await db.EnergyPrice.create({
        id: 'price-sub-no-name',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000,
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        // contract_name is not set
        selector: 'test-subscription-price-no-name',
      });

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: deviceFeatureId,
              name: 'My Energy Cost Feature',
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
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'day',
        display_mode: 'currency',
      });

      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      // Should fallback to feature name when contract_name is not set
      expect(subscriptionResult.deviceFeature.name).to.equal('My Energy Cost Feature');

      await db.EnergyPrice.destroy({ where: { id: 'price-sub-no-name' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should use firstFeature.device_id when getRootElectricMeterDevice returns null', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5ea';

      await insertConsumptionStates(deviceFeatureId, 7);

      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter No Root',
        selector: 'test-smart-meter-no-root',
        external_id: 'test-smart-meter-no-root',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      await db.EnergyPrice.create({
        id: 'price-sub-no-root',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000,
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        contract_name: 'No Root Contract',
        selector: 'test-subscription-price-no-root',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      // getRootElectricMeterDevice returns null - should fallback to firstFeature.device_id
      energySensorManager.getRootElectricMeterDevice = () => null;

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      const results = await energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'day',
        display_mode: 'currency',
      });

      // Should still find subscription prices using firstFeature.device_id
      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.not.equal(undefined);
      expect(subscriptionResult.values.length).to.equal(7);

      await db.EnergyPrice.destroy({ where: { id: 'price-sub-no-root' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should not fetch subscription prices when display_mode is kwh', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5e3';

      await insertConsumptionStates(deviceFeatureId, 7);

      // Create a device first (required for foreign key)
      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter KWH',
        selector: 'test-smart-meter-kwh',
        external_id: 'test-smart-meter-kwh',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      // Create a subscription price
      await db.EnergyPrice.create({
        id: 'price-sub-kwh',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 15000,
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        selector: 'test-subscription-price-kwh',
      });

      const stateManager = {
        get: fake((type, selector) => {
          if (type === 'deviceFeature') {
            return {
              id: deviceFeatureId,
              name: 'Energy Consumption',
              device_id: deviceId,
              category: 'energy-sensor',
              type: 'thirty-minutes-consumption',
            };
          }
          if (type === 'deviceById') {
            return {
              id: deviceId,
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
        display_mode: 'kwh',
      });

      // Subscription should not be added when display_mode is kwh
      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(1); // Only consumption, no subscription

      // Verify no subscription item exists
      const subscriptionResult = results.find((r) => r.deviceFeature.is_subscription === true);
      expect(subscriptionResult).to.equal(undefined);

      // Cleanup
      await db.EnergyPrice.destroy({ where: { id: 'price-sub-kwh' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });

    it('should handle invalid group_by with default behavior for subscription calculation', async () => {
      const deviceFeatureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
      const deviceId = 'da91dfdf-55b2-4cf8-a58b-99c0fbf6f5eb';

      await insertConsumptionStates(deviceFeatureId, 7);

      await db.Device.create({
        id: deviceId,
        name: 'Test Smart Meter Invalid GroupBy',
        selector: 'test-smart-meter-invalid',
        external_id: 'test-smart-meter-invalid',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      });

      await db.EnergyPrice.create({
        id: 'price-sub-invalid',
        electric_meter_device_id: deviceId,
        contract: 'base',
        price_type: 'subscription',
        price: 150000,
        currency: 'EUR',
        start_date: '2023-01-01',
        end_date: null,
        contract_name: 'Invalid GroupBy Contract',
        selector: 'test-subscription-price-invalid',
      });

      const stateManager = {
        get: fake((type, selector) => {
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
      };

      const energySensorManager = new EnergySensorManager(stateManager);
      energySensorManager.getRootElectricMeterDevice = () => ({
        id: deviceFeatureId,
        device_id: deviceId,
      });

      const from = new Date('2023-10-08T00:00:00.000Z');
      const to = new Date('2023-10-15T00:00:00.000Z');

      // Pass an invalid group_by - this will hit the default cases in calculateSubscriptionPrices
      // but then throw an error in the main function validation
      const promise = energySensorManager.getConsumptionByDates(['test-device-feature'], {
        from,
        to,
        group_by: 'invalid_value',
        display_mode: 'currency',
      });

      await assert.isRejected(promise, 'Invalid groupBy parameter');

      await db.EnergyPrice.destroy({ where: { id: 'price-sub-invalid' } });
      await db.Device.destroy({ where: { id: deviceId } });
    });
  });
});
