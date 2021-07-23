const { expect } = require('chai');
const uuid = require('uuid');
const EventEmitter = require('events');
const { fake } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');

const event = new EventEmitter();

const insertStates = async (fixedHour = true) => {
  const queryInterface = db.sequelize.getQueryInterface();
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  for (let i = 1; i <= 30; i += 1) {
    for (let j = 0; j < 120; j += 1) {
      const date = new Date(now.getFullYear() - 1, 10, i, fixedHour ? 12 : Math.round((j + 1) / 5), 0);
      deviceFeatureStateToInsert.push({
        id: uuid.v4(),
        device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        value: i,
        created_at: date,
        updated_at: date,
      });
    }
  }
  await queryInterface.bulkInsert('t_device_feature_state', deviceFeatureStateToInsert);
};

describe('Device.calculateAggregate', () => {
  beforeEach(async () => {
    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.bulkDelete('t_device_feature_state');
    await queryInterface.bulkDelete('t_device_feature_state_aggregate');
    await db.DeviceFeature.update(
      {
        last_monthly_aggregate: null,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
      },
      { where: {} },
    );
  });
  it('should calculate hourly aggregate', async () => {
    await insertStates(false);
    const variable = {
      // we modify the retention policy to take the last 1000 days (it'll cover this last year)
      getValue: fake.resolves('1000'),
    };
    const device = new Device(event, {}, {}, {}, {}, variable);
    await device.calculateAggregate('hourly');
    const deviceFeatureStates = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    // Max number of events
    expect(deviceFeatureStates.length).to.equal(3600);
  });
  it('should calculate daily aggregate', async () => {
    await insertStates(true);
    const variable = {
      getValue: fake.resolves(null),
    };
    const device = new Device(event, {}, {}, {}, {}, variable);
    await device.calculateAggregate('daily');
    const deviceFeatureStates = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    // 30 days * 100 = 3000
    expect(deviceFeatureStates.length).to.equal(3000);
  });
  it('should calculate monthly aggregate', async () => {
    await insertStates(true);
    const variable = {
      getValue: fake.resolves(null),
    };
    const device = new Device(event, {}, {}, {}, {}, variable);
    await device.calculateAggregate('monthly');
    const deviceFeatureStates = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    // 1 month * 100
    expect(deviceFeatureStates.length).to.equal(100);
  });
  it('should run the daily aggregate task', async () => {
    await insertStates(true);
    const variable = {
      getValue: fake.resolves(null),
    };
    const device = new Device(event, {}, {}, {}, {}, variable);
    await device.onDailyDeviceAggregateEvent();
    const deviceFeatureStates = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    // daily + monthly aggregates
    expect(deviceFeatureStates.length).to.equal(100 + 3000);
  });
  it('should run the hourly aggregate task', async () => {
    await insertStates(false);
    const variable = {
      // we modify the retention policy to take the last 1000 days (it'll cover this last year)
      getValue: fake.resolves('1000'),
    };
    const device = new Device(event, {}, {}, {}, {}, variable);
    await device.onHourlyDeviceAggregateEvent();
    const deviceFeatureStates = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    // hourly monthly aggregates
    expect(deviceFeatureStates.length).to.equal(3600);
  });
});
