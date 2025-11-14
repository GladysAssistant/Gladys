const EventEmitter = require('events');
const { expect, assert } = require('chai');
const { fake } = require('sinon');

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.destroyStatesFrom', () => {
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });

  it('should destroy states from a specific date', async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // Insert test data
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      {
        value: 1,
        created_at: sixHoursAgo,
      },
      {
        value: 2,
        created_at: fiveHoursAgo,
      },
      {
        value: 3,
        created_at: fourHoursAgo,
      },
      {
        value: 4,
        created_at: threeHoursAgo,
      },
      {
        value: 5,
        created_at: twoHoursAgo,
      },
    ]);

    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    // Destroy states from 4 hours ago onwards (should delete values 3, 4, 5)
    await deviceInstance.destroyStatesFrom('test-device-feature', fourHoursAgo);

    // Verify only states before 4 hours ago remain (values 1, 2)
    const remainingStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );

    expect(remainingStates).to.have.lengthOf(2);
    expect(remainingStates[0].value).to.equal(1);
    expect(remainingStates[1].value).to.equal(2);
  });

  it('should destroy all states when from date is before all states', async () => {
    // Insert test data
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      {
        value: 1,
        created_at: new Date('2025-08-28T10:00:00.000Z'),
      },
      {
        value: 2,
        created_at: new Date('2025-08-28T11:00:00.000Z'),
      },
      {
        value: 3,
        created_at: new Date('2025-08-28T12:00:00.000Z'),
      },
    ]);

    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    // Destroy all states
    await deviceInstance.destroyStatesFrom('test-device-feature', new Date('2025-08-28T09:00:00.000Z'));

    // Verify no states remain
    const remainingStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );

    expect(remainingStates).to.have.lengthOf(0);
  });

  it('should not destroy any states when from date is after all states', async () => {
    // Insert test data
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      {
        value: 1,
        created_at: new Date('2025-08-28T10:00:00.000Z'),
      },
      {
        value: 2,
        created_at: new Date('2025-08-28T11:00:00.000Z'),
      },
      {
        value: 3,
        created_at: new Date('2025-08-28T12:00:00.000Z'),
      },
    ]);

    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    // Try to destroy states from a future date
    await deviceInstance.destroyStatesFrom('test-device-feature', new Date('2025-08-28T15:00:00.000Z'));

    // Verify all states remain
    const remainingStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );

    expect(remainingStates).to.have.lengthOf(3);
    expect(remainingStates[0].value).to.equal(1);
    expect(remainingStates[1].value).to.equal(2);
    expect(remainingStates[2].value).to.equal(3);
  });

  it('should throw NotFoundError when device feature does not exist', async () => {
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    const promise = deviceInstance.destroyStatesFrom('non-existent-feature', new Date('2025-08-28T12:00:00.000Z'));

    await assert.isRejected(promise, 'DeviceFeature not found');
  });

  it('should only destroy states for the specified device feature', async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    // Insert test data for two different device features
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      {
        value: 1,
        created_at: fourHoursAgo,
      },
      {
        value: 2,
        created_at: twoHoursAgo,
      },
    ]);

    await db.duckDbBatchInsertState('a0f7b07e-3a63-4543-b5d7-2359d5c0d1e5', [
      {
        value: 10,
        created_at: fourHoursAgo,
      },
      {
        value: 20,
        created_at: twoHoursAgo,
      },
    ]);

    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    // Destroy states from first device feature only (from 2 hours ago)
    await deviceInstance.destroyStatesFrom('test-device-feature', twoHoursAgo);

    // Verify first device feature has only one state (4 hours ago)
    const remainingStatesFeature1 = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
    expect(remainingStatesFeature1).to.have.lengthOf(1);
    expect(remainingStatesFeature1[0].value).to.equal(1);

    // Verify second device feature still has all states
    const remainingStatesFeature2 = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      'a0f7b07e-3a63-4543-b5d7-2359d5c0d1e5',
    );
    expect(remainingStatesFeature2).to.have.lengthOf(2);
    expect(remainingStatesFeature2[0].value).to.equal(10);
    expect(remainingStatesFeature2[1].value).to.equal(20);
  });
});
