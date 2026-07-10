const { QueryTypes } = require('sequelize');
const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Purge device states of a specific feature.
 * @param {string} deviceFeatureId - Id of a device feature.
 * @param {string} jobId - Id of the job.
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeStatesByFeatureId('d47b481b-a7be-4224-9850-313cdb8a4065');
 */
async function purgeStatesByFeatureId(deviceFeatureId, jobId) {
  logger.info(`Purging states of device feature ${deviceFeatureId}`);

  // Since the DuckDB migration, device states live in DuckDB.
  const [{ count: duckDbCount }] = await db.duckDbReadConnectionAllAsync(
    `SELECT COUNT(*) AS count FROM t_device_feature_state WHERE device_feature_id = ?`,
    deviceFeatureId,
  );
  const numberOfDuckDbStatesToDelete = Number(duckDbCount);

  // States may also remain in SQLite on installations that have not run the
  // DuckDB migration yet: purge them too, or the migration would re-import
  // states of a feature that was already purged.
  const numberOfSqliteStatesToDelete = await db.DeviceFeatureState.count({
    where: {
      device_feature_id: deviceFeatureId,
    },
  });

  const numberOfDeviceFeatureStateToDelete = numberOfDuckDbStatesToDelete + numberOfSqliteStatesToDelete;

  const numberOfDeviceFeatureStateAggregateToDelete = await db.DeviceFeatureStateAggregate.count({
    where: {
      device_feature_id: deviceFeatureId,
    },
  });

  logger.info(
    `Purging "${deviceFeatureId}": ${numberOfDeviceFeatureStateToDelete} states` +
      ` (${numberOfDuckDbStatesToDelete} DuckDB + ${numberOfSqliteStatesToDelete} SQLite)` +
      ` & ${numberOfDeviceFeatureStateAggregateToDelete} aggregates to delete.`,
  );

  // Attach structured facts to the job so the front can display them (translated
  // front-side) while the purge runs and after it finishes.
  const deviceFeature = await db.DeviceFeature.findOne({
    where: { id: deviceFeatureId },
    attributes: ['name'],
    include: [
      {
        model: db.Device,
        as: 'device',
        attributes: ['name'],
      },
    ],
  });
  await this.job.updateProgress(jobId, 0, {
    ...(deviceFeature ? { device_name: deviceFeature.device.name, device_feature_name: deviceFeature.name } : {}),
    duckdb_states_count: numberOfDuckDbStatesToDelete,
    sqlite_states_count: numberOfSqliteStatesToDelete,
    aggregates_count: numberOfDeviceFeatureStateAggregateToDelete,
  });

  const numberOfIterationsStates = Math.ceil(
    numberOfSqliteStatesToDelete / this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
  );
  const iterator = [...Array(numberOfIterationsStates)];

  const numberOfIterationsStatesAggregates = Math.ceil(
    numberOfDeviceFeatureStateAggregateToDelete / this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
  );
  const iteratorAggregates = [...Array(numberOfIterationsStatesAggregates)];

  // 1 step for the DuckDB delete + the SQLite batches
  const total = 1 + numberOfIterationsStates + numberOfIterationsStatesAggregates;
  let currentBatch = 0;
  let currentProgressPercent = 0;

  // We only save progress to DB if it changed
  // Because saving progress is expensive (DB write + Websocket call)
  const updateProgressIfNeeded = async () => {
    currentBatch += 1;
    const newProgressPercent = Math.round((currentBatch * 100) / total);
    if (currentProgressPercent !== newProgressPercent) {
      currentProgressPercent = newProgressPercent;
      await this.job.updateProgress(jobId, currentProgressPercent);
    }
  };

  // The DuckDB table has no id column, so states cannot be deleted in
  // LIMIT-ed chunks like in SQLite: delete them in a single statement,
  // like device.destroy does.
  if (numberOfDuckDbStatesToDelete > 0) {
    await db.duckDbWriteConnectionAllAsync(
      'DELETE FROM t_device_feature_state WHERE device_feature_id = ?',
      deviceFeatureId,
    );
  }
  await updateProgressIfNeeded();

  await Promise.each(iterator, async () => {
    await db.sequelize.query(
      `
      DELETE FROM t_device_feature_state WHERE id IN (
        SELECT id FROM t_device_feature_state
        WHERE device_feature_id = :id
        LIMIT :limit
      );
    `,
      {
        replacements: {
          id: deviceFeatureId,
          limit: this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
        },
        type: QueryTypes.SELECT,
      },
    );
    await updateProgressIfNeeded();
    await Promise.delay(this.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH);
  });

  await Promise.each(iteratorAggregates, async () => {
    await db.sequelize.query(
      `
      DELETE FROM t_device_feature_state_aggregate WHERE id IN (
        SELECT id FROM t_device_feature_state_aggregate
        WHERE device_feature_id = :id
        LIMIT :limit
      );
    `,
      {
        replacements: {
          id: deviceFeatureId,
          limit: this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
        },
        type: QueryTypes.SELECT,
      },
    );
    await updateProgressIfNeeded();
    await Promise.delay(this.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH);
  });
  return {
    numberOfDeviceFeatureStateToDelete,
    numberOfDeviceFeatureStateAggregateToDelete,
  };
}

module.exports = {
  purgeStatesByFeatureId,
};
