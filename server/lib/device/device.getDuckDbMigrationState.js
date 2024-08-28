const db = require('../../models');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description GetDuckDbMigrationState.
 * @example await getDuckDbMigrationState();
 * @returns {Promise} Resolve with current migration state.
 */
async function getDuckDbMigrationState() {
  const isDuckDbMigrated = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DUCKDB_MIGRATED);
  const [{ count: duckDbDeviceStateCount }] = await db.duckDbReadConnectionAllAsync(`
    SELECT COUNT(value) as count FROM t_device_feature_state;  
  `);
  const sqliteDeviceStateCount = await db.DeviceFeatureState.count();

  return {
    is_duck_db_migrated: isDuckDbMigrated === 'true',
    duck_db_device_count: Number(duckDbDeviceStateCount),
    sqlite_db_device_state_count: sqliteDeviceStateCount,
  };
}

module.exports = {
  getDuckDbMigrationState,
};
