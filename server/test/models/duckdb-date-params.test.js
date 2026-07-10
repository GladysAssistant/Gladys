const { expect } = require('chai');

const db = require('../../models');

describe('DuckDB Date parameter binding', () => {
  afterEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    // Restore the default session timezone on the write connection
    await db.duckDbWriteConnectionAllAsync('RESET timezone;');
  });

  it('should bind JS Date params as naive TIMESTAMP, like the legacy duckdb package', async () => {
    // The legacy `duckdb` package bound JS Date params as NAIVE timestamps, which
    // DuckDB casts to TIMESTAMPTZ through the session timezone when compared to the
    // created_at column. This test locks that behaviour with a non-UTC timezone:
    // with Europe/Paris (UTC+1 in January), a naive '23:00' boundary means 22:00 UTC,
    // so a state stored at 22:30 UTC must match `created_at > boundary`.
    const deviceFeatureId = 'a3b52dd0-4447-4907-a5f9-49f93d10e07e';
    await db.duckDbSetTimezone('Europe/Paris');
    await db.duckDbInsertState(deviceFeatureId, 42, new Date('2020-01-01T22:30:00.000Z'));

    const boundary = new Date('2020-01-01T23:00:00.000Z');
    const rows = await db.duckDbWriteConnectionAllAsync(
      'SELECT COUNT(*) AS nb FROM t_device_feature_state WHERE device_feature_id = ? AND created_at > ?',
      deviceFeatureId,
      boundary,
    );
    expect(Number(rows[0].nb)).to.equal(1);
  });
});
