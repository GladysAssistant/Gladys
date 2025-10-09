const EventEmitter = require('events');
const { expect, assert } = require('chai');
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

describe('Device.getDeviceFeatureStates', function Describe() {
  this.timeout(15000);
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });
  it('should return last hour states', async () => {
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      {
        value: 1,
        created_at: new Date('2025-08-28T15:00:00.000Z'),
      },
      {
        value: 2,
        created_at: new Date('2025-08-28T15:01:00.000Z'),
      },
      {
        value: 3,
        created_at: new Date('2025-08-28T15:03:00.000Z'),
      },
      {
        value: 4,
        created_at: new Date('2025-08-28T15:04:00.000Z'),
      },
    ]);
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
    const values = await deviceInstance.getDeviceFeatureStates(
      'my-feature',
      new Date('2025-08-28T15:01:00.000Z'),
      new Date('2025-08-28T15:03:00.000Z'),
    );
    expect(values).to.have.lengthOf(2);
    expect(values).to.deep.equal([
      { created_at: new Date('2025-08-28T15:01:00.000Z'), value: 2 },
      { created_at: new Date('2025-08-28T15:03:00.000Z'), value: 3 },
    ]);
  });

  it('should throw NotFoundError when device feature does not exist', async () => {
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null), // Return null to simulate device feature not found
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    const promise = deviceInstance.getDeviceFeatureStates(
      'non-existent-feature',
      new Date('2025-08-28T15:01:00.000Z'),
      new Date('2025-08-28T15:03:00.000Z'),
    );

    await assert.isRejected(promise, 'DeviceFeature not found');
  });
});
