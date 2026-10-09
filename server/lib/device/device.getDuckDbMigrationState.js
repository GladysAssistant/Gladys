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
  const sqliteDeviceStateAggregateCount = await db.DeviceFeatureStateAggregate.count();

  logger.info(`Device : getDuckDbMigrationState : isDuckDbMigrated: ${isDuckDbMigrated}`);
  logger.info(`Device : getDuckDbMigrationState : duckDbDeviceStateCount: ${duckDbDeviceStateCount}`);
  logger.info(`Device : getDuckDbMigrationState : sqliteDeviceStateCount: ${sqliteDeviceStateCount}`);
  logger.info(`Device : getDuckDbMigrationState : sqliteDeviceStateAggregateCount: ${sqliteDeviceStateAggregateCount}`);

  return {
    is_duck_db_migrated: isDuckDbMigrated === 'true',
    duck_db_device_count: Number(duckDbDeviceStateCount),
    sqlite_db_device_state_count: sqliteDeviceStateCount,
    // Served next to the states count: an install can have no state left and still carry
    // millions of aggregates, and the card then announced "0 state in SQLite" while it was
    // displayed precisely because of those aggregates.
    sqlite_db_device_state_aggregate_count: sqliteDeviceStateAggregateCount,
    // Migrating/purging states is only useful while rows remain in the legacy SQLite tables.
    // Aggregates are counted too: the purge empties the states first, then the aggregates,
    // so a crash in between must not hide the card that is the only way to finish the purge.
    // SQLite is still used for all the other data (users, devices, scenes...).
    is_migration_needed: sqliteDeviceStateCount > 0 || sqliteDeviceStateAggregateCount > 0,
  };
}

module.exports = {
  getDuckDbMigrationState,
};
