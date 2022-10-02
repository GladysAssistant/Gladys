const { expect } = require('chai');
const uuid = require('uuid');
const EventEmitter = require('events');
const sinon = require('sinon');

const { fake } = sinon;
const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

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

describe('Device.calculateAggregate', function Before() {
  this.timeout(60000);
  let clock;
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
    clock = sinon.useFakeTimers({
      now: 1635131280000,
    });
  });
  afterEach(() => {
    clock.restore();
  });
  it('should calculate hourly aggregate', async () => {
    await insertStates(false);
    const variable = {
      // we modify the retention policy to take the last 1000 days (it'll cover this last year)
      getValue: fake.resolves('1000'),
    };
    const job = new Job(event);
    const device = new Device(event, {}, {}, {}, {}, variable, job);
    await device.calculateAggregate('hourly');
    const deviceFeatureStates = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    // Max number of events
    expect(deviceFeatureStates.length).to.equal(3600);
  });
  it('should calculate hourly aggregate with retention policy instead of last aggregate', async () => {
    await insertStates(false);
    const deviceFeaturesInDb = await db.DeviceFeature.findAll();
    deviceFeaturesInDb[0].update({
      // old date
      last_hourly_aggregate: new Date(2010, 10, 10),
    });
    const variable = {
      // we modify the retention policy to take the last 5 days only (for testing)
      getValue: fake.resolves('5'),
    };
    const job = new Job(event);
    const device = new Device(event, {}, {}, {}, {}, variable, job);
    await device.calculateAggregate('hourly');
  });
  it('should calculate hourly aggregate with last aggregate from device', async () => {
    await insertStates(false);
    const deviceFeaturesInDb = await db.DeviceFeature.findAll();
    deviceFeaturesInDb[0].update({
      last_hourly_aggregate: new Date(),
    });
    const variable = {
      // we modify the retention policy to take the last 1000 days (for testing)
      getValue: fake.resolves('1000'),
    };
    const job = new Job(event);
    const device = new Device(event, {}, {}, {}, {}, variable, job);
    await device.calculateAggregate('hourly');
  });
  it('should calculate daily aggregate', async () => {
    await insertStates(true);
    const variable = {
      getValue: fake.resolves(null),
    };
    const job = new Job(event);
    const device = new Device(event, {}, {}, {}, {}, variable, job);
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
    const job = new Job(event);
    const device = new Device(event, {}, {}, {}, {}, variable, job);
    await device.calculateAggregate('monthly');
    const deviceFeatureStates = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    // 1 month * 100
    expect(deviceFeatureStates.length).to.equal(100);
  });
  it('should run the hourly aggregate task', async () => {
    await insertStates(true);
    const variable = {
      // we modify the retention policy to take the last 1000 days (it'll cover this last year)
      getValue: fake.resolves('1000'),
    };
    const job = new Job(event);
    const device = new Device(event, {}, {}, {}, {}, variable, job);
    await device.onHourlyDeviceAggregateEvent();
    const deviceFeatureStates = await db.DeviceFeatureStateAggregate.findAll({
      raw: true,
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    // daily + hourly + monthly
    expect(deviceFeatureStates.length).to.equal(3000 + 3000 + 100);
  });
  it('should run the hourly aggregate task with failed job but not crash', async () => {
    await insertStates(true);
    const variable = {
      // we modify the retention policy to take the last 1000 days (it'll cover this last year)
      getValue: fake.resolves('1000'),
    };
    const job = new Job(event);
    job.wrapper = () => {
      return async () => {
        throw new Error('something failed');
      };
    };
    const device = new Device(event, {}, {}, {}, {}, variable, job);
    await device.onHourlyDeviceAggregateEvent();
    // if it doesn't crash, it worked
  });
});
