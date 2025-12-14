const db = require('../../models');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description GetDuckDbMigrationState.
 * @example await getDuckDbMigrationState();
 * @returns {Promise} Resolve with current migration state.
 */
async function getDuckDbMigrationState() {
  logger.info('Device : getDuckDbMigrationState');
  const isDuckDbMigrated = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DUCKDB_MIGRATED);
  // Use estimated_size from DuckDB metadata for fast approximate count
  const [{ estimated_size: duckDbDeviceStateCount }] = await db.duckDbReadConnectionAllAsync(`
    SELECT estimated_size FROM duckdb_tables() WHERE table_name = 't_device_feature_state';
  `);
  const sqliteDeviceStateCount = await db.DeviceFeatureState.count();

  logger.info(`Device : getDuckDbMigrationState : isDuckDbMigrated: ${isDuckDbMigrated}`);
  logger.info(`Device : getDuckDbMigrationState : duckDbDeviceStateCount: ${duckDbDeviceStateCount}`);
  logger.info(`Device : getDuckDbMigrationState : sqliteDeviceStateCount: ${sqliteDeviceStateCount}`);

  return {
    is_duck_db_migrated: isDuckDbMigrated === 'true',
    duck_db_device_count: Number(duckDbDeviceStateCount),
    sqlite_db_device_state_count: sqliteDeviceStateCount,
  };
}

module.exports = {
  getDuckDbMigrationState,
};
