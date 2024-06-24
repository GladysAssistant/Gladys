const db = require('../../models');
/**
 * @description Migrate all states from SQLite to DuckDB.
 * @example migrateFromSQLiteToDuckDb();
 */
async function migrateFromSQLiteToDuckDb() {
  const oldestStatePerDeviceFeatureId = await db.duckDbReadConnectionAllAsync(`
        SELECT 
            MIN(created_at),
            device_feature_id
        FROM t_device_feature_state
        GROUP BY device_feature_id; 
    `);
}

module.exports = {
  migrateFromSQLiteToDuckDb,
};
