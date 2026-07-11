const { expect } = require('chai');
const EventEmitter = require('events');
const { fake, assert } = require('sinon');

const Device = require('../../../lib/device');
const db = require('../../../models');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const event = new EventEmitter();

// Feature seeded in the test database
const EXISTING_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
// Feature which does not exist (anymore): its states are orphaned
const ORPHANED_FEATURE_ID = 'e40a3e0a-2340-4f13-b4e9-e050c78d5dcd';

const buildDevice = (variableValue) => {
  const stateManager = new StateManager(event);
  const job = new Job(event);
  const variable = {
    getValue: fake.resolves(variableValue),
    setValue: fake.resolves(null),
  };
  const device = new Device(event, {}, stateManager, {}, {}, variable, job);
  device.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH = 1;
  return { device, variable };
};

describe('device.purgeOrphanedDuckDbStates', async function Describe() {
  this.timeout(5000);
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    await db.duckDbBatchInsertState(EXISTING_FEATURE_ID, [
      { value: 1, created_at: new Date('2025-06-15T10:00:00.000Z') },
      { value: 0, created_at: new Date('2025-08-28T15:02:00.000Z') },
    ]);
    // Orphaned states spread over 3 months, so the purge walks several slices
    await db.duckDbBatchInsertState(ORPHANED_FEATURE_ID, [
      { value: 12, created_at: new Date('2025-06-01T00:00:00.000Z') },
      { value: 13, created_at: new Date('2025-07-15T12:00:00.000Z') },
      { value: 14, created_at: new Date('2025-08-28T15:03:00.000Z') },
    ]);
  });
  it('should purge orphaned states in monthly slices and set the flag', async () => {
    const { device, variable } = buildDevice(null);
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
    assert.calledWith(variable.setValue, SYSTEM_VARIABLE_NAMES.DUCKDB_ORPHANED_STATES_PURGED, 'true');
  });
  it('should not purge again once the flag is set', async () => {
    const { device, variable } = buildDevice('true');
    const res = await device.purgeOrphanedDuckDbStates();
    expect(res).to.equal(null);
    assert.notCalled(variable.setValue);
    const orphanedStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      ORPHANED_FEATURE_ID,
    );
    expect(orphanedStates).to.have.lengthOf(3);
  });
  it('should set the flag without purging anything on an empty table', async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    const { device, variable } = buildDevice(null);
    const res = await device.purgeOrphanedDuckDbStates();
    expect(res).to.deep.equal({
      numberOfOrphanedDuckDbStatesToDelete: 0,
    });
    assert.calledWith(variable.setValue, SYSTEM_VARIABLE_NAMES.DUCKDB_ORPHANED_STATES_PURGED, 'true');
  });
});
