const { expect } = require('chai');

const db = require('../../models');

const FEATURE_ID = 'b3b52dd0-4447-4907-a5f9-49f93d10e07e';
const OTHER_FEATURE_ID = 'c3b52dd0-4447-4907-a5f9-49f93d10e07e';

const readValues = async (featureId) => {
  const rows = await db.duckDbReadConnectionAllAsync(
    'SELECT value FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
    featureId,
  );
  return rows.map((row) => row.value);
};

describe('DuckDB duckDbReplaceStatesFrom', () => {
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    await db.duckDbBatchInsertState(FEATURE_ID, [
      { value: 1, created_at: new Date('2026-01-01T00:00:00.000Z') },
      { value: 2, created_at: new Date('2026-01-01T01:00:00.000Z') },
      { value: 3, created_at: new Date('2026-01-01T02:00:00.000Z') },
    ]);
    await db.duckDbBatchInsertState(OTHER_FEATURE_ID, [{ value: 9, created_at: new Date('2026-01-01T01:00:00.000Z') }]);
  });
  afterEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });

  it('should replace the states from a date and leave the other features untouched', async () => {
    await db.duckDbReplaceStatesFrom(FEATURE_ID, new Date('2026-01-01T01:00:00.000Z'), [
      { value: 20, created_at: new Date('2026-01-01T01:00:00.000Z') },
      { value: 30, created_at: new Date('2026-01-01T02:00:00.000Z') },
      { value: 40, created_at: new Date('2026-01-01T03:00:00.000Z') },
    ]);
    expect(await readValues(FEATURE_ID)).to.deep.equal([1, 20, 30, 40]);
    expect(await readValues(OTHER_FEATURE_ID)).to.deep.equal([9]);
    // no new state: the window is only emptied
    await db.duckDbReplaceStatesFrom(FEATURE_ID, new Date('2026-01-01T02:00:00.000Z'), []);
    expect(await readValues(FEATURE_ID)).to.deep.equal([1, 20]);
  });

  it('should keep the previous states when the insert fails', async () => {
    await expect(
      db.duckDbReplaceStatesFrom(FEATURE_ID, new Date('2026-01-01T01:00:00.000Z'), [
        { value: 20, created_at: new Date('2026-01-01T01:00:00.000Z') },
        { value: 'not a number', created_at: new Date('2026-01-01T02:00:00.000Z') },
      ]),
    ).to.be.rejected;
    expect(await readValues(FEATURE_ID)).to.deep.equal([1, 2, 3]);
  });
});
