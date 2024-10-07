const Promise = require('bluebird');
const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

const migrateStateRecursive = async (deviceFeatureId, condition) => {
  logger.info(`DuckDB : Migrating device feature = ${deviceFeatureId}, offset = ${condition.offset}`);
  // Get all device feature state in SQLite that match the condition
  const states = await db.DeviceFeatureState.findAll(condition);
  logger.info(`DuckDB : Device feature = ${deviceFeatureId} has ${states.length} states to migrate.`);
  if (states.length === 0) {
    return null;
  }
  await db.duckDbBatchInsertState(deviceFeatureId, states);
  const newCondition = {
    ...condition,
    offset: condition.offset + condition.limit,
  };
  // We see if there are other states
  await migrateStateRecursive(deviceFeatureId, newCondition);
  return null;
};

/**
 * @description Migrate all states from SQLite to DuckDB.
 * @param {string} jobId - ID of the job.
 * @param {number} duckDbMigrationPageLimit - Number of rows to migrate in one shot.
 * @returns {Promise} Resolve when finished.
 * @example migrateFromSQLiteToDuckDb();
 */
async function migrateFromSQLiteToDuckDb(jobId, duckDbMigrationPageLimit = 40000) {
  // Check if migration was already executed
  const isDuckDbMigrated = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DUCKDB_MIGRATED);
  if (isDuckDbMigrated === 'true') {
    logger.info('DuckDB : Already migrated from SQLite. Not migrating.');
    return null;
  }
  logger.info('DuckDB: Migrating data from SQLite');
  const oldestStateInDuckDBPerDeviceFeatureId = await db.duckDbReadConnectionAllAsync(`
        SELECT 
            MIN(created_at) as created_at,
            device_feature_id
        FROM t_device_feature_state
        GROUP BY device_feature_id; 
    `);
  logger.info(
    `DuckDB: Found ${oldestStateInDuckDBPerDeviceFeatureId.length} already migrated device features in DuckDB.`,
  );
  const deviceFeatures = await db.DeviceFeature.findAll();
  logger.info(`DuckDB: Migrating ${deviceFeatures.length} device features`);
  await Promise.mapSeries(deviceFeatures, async (deviceFeature, deviceFeatureIndex) => {
    const currentDeviceFeatureOldestStateInDuckDB = oldestStateInDuckDBPerDeviceFeatureId.find(
      (s) => s.device_feature_id === deviceFeature.id,
    );
    const condition = {
      raw: true,
      attributes: ['value', 'created_at'],
      where: {
        device_feature_id: deviceFeature.id,
      },
      order: [['created_at', 'DESC']],
      limit: duckDbMigrationPageLimit,
      offset: 0,
    };
    if (currentDeviceFeatureOldestStateInDuckDB) {
      condition.where.created_at = {
        [Op.lt]: currentDeviceFeatureOldestStateInDuckDB.created_at,
      };
    }
    await migrateStateRecursive(deviceFeature.id, condition);
    const newProgressPercent = Math.round((deviceFeatureIndex * 100) / deviceFeatures.length);
    await this.job.updateProgress(jobId, newProgressPercent);
  });

  logger.info(`DuckDB: Finished migrating DuckDB.`);

  // Save that the migration was executed
  await this.variable.setValue(SYSTEM_VARIABLE_NAMES.DUCKDB_MIGRATED, 'true');
  return null;
}

module.exports = {
  migrateFromSQLiteToDuckDb,
};
