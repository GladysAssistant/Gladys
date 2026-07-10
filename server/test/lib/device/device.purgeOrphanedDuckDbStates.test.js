const { expect } = require('chai');
const EventEmitter = require('events');

const Device = require('../../../lib/device');
const db = require('../../../models');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { JOB_TYPES } = require('../../../utils/constants');

const event = new EventEmitter();

// Feature seeded in the test database
const EXISTING_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
// Feature which does not exist (anymore): its states are orphaned
const ORPHANED_FEATURE_ID = 'e40a3e0a-2340-4f13-b4e9-e050c78d5dcd';

describe('device.purgeOrphanedDuckDbStates', async function Describe() {
  this.timeout(5000);
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    await db.duckDbBatchInsertState(EXISTING_FEATURE_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 0, created_at: new Date('2025-08-28T15:02:00.000Z') },
    ]);
    await db.duckDbBatchInsertState(ORPHANED_FEATURE_ID, [
      { value: 12, created_at: new Date('2025-08-28T15:01:00.000Z') },
      { value: 13, created_at: new Date('2025-08-28T15:03:00.000Z') },
      { value: 14, created_at: new Date('2025-08-28T15:05:00.000Z') },
    ]);
  });
  it('should purge orphaned states and keep states of existing features', async () => {
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const res = await device.purgeOrphanedDuckDbStates();
    expect(res).to.deep.equal({
      numberOfOrphanedDuckDbStatesToDelete: 3,
    });
    const orphanedStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      ORPHANED_FEATURE_ID,
    );
    expect(orphanedStates).to.have.lengthOf(0);
    const existingStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      EXISTING_FEATURE_ID,
    );
    expect(existingStates).to.have.lengthOf(2);
    // The job carries the purged count (displayed and translated by the front)
    const jobRecord = await db.Job.findOne({
      where: { type: JOB_TYPES.DEVICE_STATES_PURGE_ORPHANED_DUCKDB_STATES },
      order: [['created_at', 'DESC']],
    });
    expect(jobRecord.data).to.deep.equal({
      orphaned_states_count: 3,
    });
  });
  it('should do nothing when there is no orphaned state', async () => {
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    await device.purgeOrphanedDuckDbStates();
    const res = await device.purgeOrphanedDuckDbStates();
    expect(res).to.deep.equal({
      numberOfOrphanedDuckDbStatesToDelete: 0,
    });
    const existingStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      EXISTING_FEATURE_ID,
    );
    expect(existingStates).to.have.lengthOf(2);
  });
});
