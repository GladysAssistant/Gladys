const EventEmitter = require('events');
const { expect, assert } = require('chai');
const Promise = require('bluebird');
const sinon = require('sinon');
const { fake } = require('sinon');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

// Extend Day.js with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const insertStates = async (intervalInMinutes) => {
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = 2000;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
    const date = new Date(startAt.getTime() + ((intervalInMinutes * 60 * 1000) / statesToInsert) * i);
    deviceFeatureStateToInsert.push({
      value: i,
      created_at: date,
    });
  }
  await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', deviceFeatureStateToInsert);
};

const insertBinaryStates = async (intervalInMinutes) => {
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = 2000;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
    const date = new Date(startAt.getTime() + ((intervalInMinutes * 60 * 1000) / statesToInsert) * i);
    deviceFeatureStateToInsert.push({
      value: i % 2, // Alternating binary values
      created_at: date,
    });
  }
  await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e5', deviceFeatureStateToInsert);
};

const insertBinaryStatesWithChanges = async (intervalInMinutes) => {
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = 3000;
  let currentValue = Math.round(Math.random()); // Start with a random binary value (0 or 1)
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
    const date = new Date(startAt.getTime() + ((intervalInMinutes * 60 * 1000) / statesToInsert) * i);
    deviceFeatureStateToInsert.push({
      value: currentValue,
      created_at: date,
    });
    // Randomly decide whether to change the value or keep it the same
    if (Math.random() > 0.7) {
      // 30% chance to change the value
      currentValue = currentValue === 0 ? 1 : 0;
    }
  }
  await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e6', deviceFeatureStateToInsert);
};

describe('Device.getDeviceFeaturesAggregates non binary feature', function Describe() {
  this.timeout(15000);

  let clock;
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');

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
    const { values, device, deviceFeature } = await deviceInstance.getDeviceFeaturesAggregates(
      'test-device-feature',
      60,
      100,
    );
    expect(values).to.have.lengthOf(100);
    expect(device).to.have.property('name');
    expect(deviceFeature).to.have.property('name');
  });
  it('should test timezone behavior', async () => {
    // Create current date in Toronto timezone, 30 minutes ago
    const torontoDate = dayjs()
      .tz('America/Toronto')
      .subtract(30, 'minute')
      .toDate();

    await db.duckDbInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', 1, torontoDate);
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
    const { values } = await deviceInstance.getDeviceFeaturesAggregates('test-device-feature', 60, 100);
    expect(values).to.have.lengthOf(1);
    expect(values[0]).to.have.property('value');
    expect(values[0]).to.have.property('max_value');
    expect(values[0]).to.have.property('min_value');
    expect(values[0]).to.have.property('sum_value');
    expect(values[0]).to.have.property('count_value');
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
    const { values } = await device.getDeviceFeaturesAggregates('test-device-feature', 24 * 60, 100);
    expect(values).to.have.lengthOf(100);
  });

  const GROUPS = [
    {
      period: 'day',
      numberOfDaysToInsert: 2,
      expectedResults: 2,
    },
    {
      period: 'week',
      numberOfDaysToInsert: 3 * 7,
      expectedResults: 4,
    },
    {
      period: 'month',
      numberOfDaysToInsert: 2 * 30,
      expectedResults: 3,
    },
    {
      period: 'year',
      numberOfDaysToInsert: 365,
      expectedResults: 2,
    },
  ];

  GROUPS.forEach((group) => {
    it(`should group by ${group.period}`, async () => {
      await Promise.each([...Array(group.numberOfDaysToInsert).keys()], async (i) => {
        const dateFromXDaysAgo = dayjs()
          .subtract(i, 'day')
          .toDate();
        await db.duckDbInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', i, dateFromXDaysAgo);
      });
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
      const { values } = await device.getDeviceFeaturesAggregates(
        'test-device-feature',
        group.numberOfDaysToInsert * 24 * 60,
        null,
        group.period,
      );
      expect(values).to.have.lengthOf(group.expectedResults);
      expect(values[0]).to.have.property('value');
      expect(values[0]).to.have.property('max_value');
      expect(values[0]).to.have.property('min_value');
      expect(values[0]).to.have.property('sum_value');
      expect(values[0]).to.have.property('count_value');
    });
  });

  it('should return error, group by function is not supported', async () => {
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
    const promise = device.getDeviceFeaturesAggregates('test-device-feature', 24 * 60, null, 'blabla');
    return assert.isRejected(promise, 'Invalid groupBy parameter. Must be one of: hour, day, week, month, year');
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
    const { values } = await device.getDeviceFeaturesAggregates('test-device-feature', 3 * 24 * 60, 100);
    expect(values).to.have.lengthOf(100);
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
    const { values } = await device.getDeviceFeaturesAggregates('test-device-feature', 30 * 24 * 60, 100);
    expect(values).to.have.lengthOf(100);
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

describe('Device.getDeviceFeaturesAggregates binary feature', function Describe() {
  this.timeout(15000);

  let clock;
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');

    clock = sinon.useFakeTimers({
      now: 1635131280000,
    });
  });
  afterEach(() => {
    clock.restore();
  });

  it('should return last hour states for binary feature', async () => {
    await insertBinaryStates(120);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e5',
        name: 'binary-feature',
        type: 'binary',
      }),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const { values, device, deviceFeature } = await deviceInstance.getDeviceFeaturesAggregates(
      'binary-feature',
      60,
      100,
    );
    expect(values).to.have.lengthOf(100);
    expect(device).to.have.property('name');
    expect(deviceFeature).to.have.property('name');
  });

  it('should return last day states for binary feature', async () => {
    await insertBinaryStates(48 * 60);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e5',
        name: 'binary-feature',
        type: 'binary',
      }),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const { values } = await device.getDeviceFeaturesAggregates('binary-feature', 24 * 60, 100);
    expect(values).to.have.lengthOf(100);
  });

  it('should return last 300 state changes for binary feature', async () => {
    await insertBinaryStatesWithChanges(48 * 60);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e6',
        name: 'binary-feature',
        type: 'binary',
      }),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
    const { values, device, deviceFeature } = await deviceInstance.getDeviceFeaturesAggregates(
      'binary-feature',
      24 * 60,
      300,
    );
    expect(values).to.have.lengthOf(300);
    expect(device).to.have.property('name');
    expect(deviceFeature).to.have.property('name');

    values.forEach((value) => {
      expect(value).to.have.property('value');
      // Check that both created_at and end_time are present
      expect(value).to.have.property('created_at');
      expect(value).to.have.property('end_time');
    });

    // Check that the values are state changes
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i].value).to.not.equal(values[i - 1].value);
    }
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i].value).to.not.equal(values[i - 1].value);
    }
  });
});
