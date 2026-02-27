const EventEmitter = require('events');
const { expect, assert } = require('chai');
const { fake } = require('sinon');

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.destroyStatesBetween', () => {
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });

  it('should destroy states between two dates', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      { value: 1, created_at: fiveHoursAgo },
      { value: 2, created_at: fourHoursAgo },
      { value: 3, created_at: threeHoursAgo },
      { value: 4, created_at: twoHoursAgo },
      { value: 5, created_at: oneHourAgo },
    ]);

    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    await deviceInstance.destroyStatesBetween('test-device-feature', fourHoursAgo, twoHoursAgo);

    const remainingStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );

    expect(remainingStates).to.have.lengthOf(2);
    expect(remainingStates[0].value).to.equal(1);
    expect(remainingStates[1].value).to.equal(5);
  });

  it('should not destroy any states when range is outside all states', async () => {
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      { value: 1, created_at: new Date('2025-08-28T10:00:00.000Z') },
      { value: 2, created_at: new Date('2025-08-28T11:00:00.000Z') },
      { value: 3, created_at: new Date('2025-08-28T12:00:00.000Z') },
    ]);

    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    await deviceInstance.destroyStatesBetween(
      'test-device-feature',
      new Date('2025-08-28T15:00:00.000Z'),
      new Date('2025-08-28T16:00:00.000Z'),
    );

    const remainingStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );

    expect(remainingStates).to.have.lengthOf(3);
  });

  it('should throw NotFoundError when device feature does not exist', async () => {
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    const promise = deviceInstance.destroyStatesBetween(
      'non-existent-feature',
      new Date('2025-08-28T12:00:00.000Z'),
      new Date('2025-08-28T13:00:00.000Z'),
    );

    await assert.isRejected(promise, 'DeviceFeature not found');
  });
});
