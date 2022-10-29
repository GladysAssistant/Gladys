const EventEmitter = require('events');
const { expect, assert } = require('chai');
const sinon = require('sinon');
const uuid = require('uuid');
const { fake } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const insertStates = async (intervalInMinutes) => {
  const queryInterface = db.sequelize.getQueryInterface();
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = 2000;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
    const date = new Date(startAt.getTime() + ((intervalInMinutes * 60 * 1000) / statesToInsert) * i);
    deviceFeatureStateToInsert.push({
      id: uuid.v4(),
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: i,
      created_at: date,
      updated_at: date,
    });
  }
  await queryInterface.bulkInsert('t_device_feature_state', deviceFeatureStateToInsert);
};

describe('Device.getDeviceFeaturesAggregates', function Describe() {
  this.timeout(15000);

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
  it('should return last hour states', async () => {
    await insertStates(120);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'my-feature',
      }),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    await deviceInstance.calculateAggregate('hourly');
    const { values, device, deviceFeature } = await deviceInstance.getDeviceFeaturesAggregates(
      'test-device-feature',
      60,
      100,
    );
    expect(values).to.have.lengthOf(100);
    expect(device).to.have.property('name');
    expect(deviceFeature).to.have.property('name');
  });
  it('should return last day states', async () => {
    await insertStates(48 * 60);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'my-feature',
      }),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    await device.calculateAggregate('hourly');
    const { values } = await device.getDeviceFeaturesAggregates('test-device-feature', 24 * 60, 100);
    expect(values).to.have.lengthOf(100);
  });
  it('should return last day states', async () => {
    await insertStates(4 * 24 * 60);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'my-feature',
      }),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    await device.calculateAggregate('hourly');
    const { values } = await device.getDeviceFeaturesAggregates('test-device-feature', 3 * 24 * 60, 100);
    expect(values).to.have.lengthOf(72);
  });
  it('should return last month states', async () => {
    await insertStates(2 * 30 * 24 * 60);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'my-feature',
      }),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    await device.calculateAggregate('hourly');
    await device.calculateAggregate('daily');
    const { values } = await device.getDeviceFeaturesAggregates('test-device-feature', 30 * 24 * 60, 100);
    expect(values).to.have.lengthOf(30);
  });
  it('should return last year states', async () => {
    await insertStates(2 * 365 * 24 * 60);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'my-feature',
      }),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    await device.calculateAggregate('hourly');
    await device.calculateAggregate('daily');
    await device.calculateAggregate('monthly');
    const { values } = await device.getDeviceFeaturesAggregates('test-device-feature', 365 * 24 * 60, 100);
    expect(values).to.have.lengthOf(100);
  });
  it('should return error, device feature doesnt exist', async () => {
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const promise = device.getDeviceFeaturesAggregates('this-device-does-not-exist', 365 * 24 * 60, 100);
    return assert.isRejected(promise, 'DeviceFeature not found');
  });
});
