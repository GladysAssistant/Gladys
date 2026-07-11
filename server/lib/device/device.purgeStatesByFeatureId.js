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

  // Attach the purge target to the job first: counting millions of states can
  // take a while and the jobs page would show a blank entry meanwhile.
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
    step: 'waiting_database',
  });

  // The DuckDB connection is FIFO: submit the probe and the real query in the
  // same tick, so no other job can slip between them — when the probe resolves,
  // the count below is actually running, not merely queued behind another job.
  // Since the DuckDB migration, device states live in DuckDB. The explicit UUID
  // cast is on the parameter: without it, comparing a VARCHAR parameter against
  // the UUID column can cost a per-row cast over the whole table.
  const waitStartedAt = Date.now();
  const probePromise = db.duckDbReadConnectionAllAsync('SELECT 1');
  const countPromise = db.duckDbReadConnectionAllAsync(
    `SELECT COUNT(*) AS count FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID)`,
    deviceFeatureId,
  );
  await probePromise;
  const countStartedAt = Date.now();
  await this.job.updateProgress(jobId, 0, { step: 'counting' });
  const [{ count: duckDbCount }] = await countPromise;
  const numberOfDuckDbStatesToDelete = Number(duckDbCount);
  logger.info(
    `Purging "${deviceFeatureId}": waited ${countStartedAt - waitStartedAt}ms for the read connection,` +
      ` counted ${numberOfDuckDbStatesToDelete} DuckDB states in ${Date.now() - countStartedAt}ms.`,
  );

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

  // Attach the counts to the job so the front can display them (translated
  // front-side) while the purge runs and after it finishes.
  await this.job.updateProgress(jobId, 0, {
    duckdb_states_count: numberOfDuckDbStatesToDelete,
    sqlite_states_count: numberOfSqliteStatesToDelete,
    aggregates_count: numberOfDeviceFeatureStateAggregateToDelete,
    step: 'waiting_database',
  });
  // Same probe on the write connection: deletes may have to wait behind
  // another purge already deleting.
  await db.duckDbWriteConnectionAllAsync('SELECT 1');
  await this.job.updateProgress(jobId, 0, { step: 'deleting_states' });

  // The DuckDB table has no id column, so states cannot be deleted in LIMIT-ed
  // chunks like in SQLite. Delete them in created_at slices instead: it reports
  // progress, and it releases the single DuckDB write connection between two
  // slices so live state inserts are not blocked for the whole purge.
  let sliceUpperBounds = [];
  if (numberOfDuckDbStatesToDelete > 0) {
    // Every DELETE statement is a transaction rewriting row groups: slicing a
    // small purge is pure overhead. Only big purges (where progress reporting
    // and releasing the write connection matter) are sliced.
    if (numberOfDuckDbStatesToDelete <= this.DUCKDB_STATES_PURGE_SINGLE_DELETE_THRESHOLD) {
      sliceUpperBounds = [null];
    } else {
      const numberOfSlices = this.DUCKDB_STATES_PURGE_MAX_TIME_SLICES;
      const [{ min_date: minDate, max_date: maxDate }] = await db.duckDbReadConnectionAllAsync(
        `SELECT MIN(created_at) AS min_date, MAX(created_at) AS max_date
         FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID)`,
        deviceFeatureId,
      );
      const stepInMs = (new Date(maxDate).getTime() - new Date(minDate).getTime()) / numberOfSlices;
      sliceUpperBounds = [...Array(numberOfSlices)].map((value, i) => {
        // The last slice has no upper bound so it catches every remaining state
        return i === numberOfSlices - 1 ? null : new Date(new Date(minDate).getTime() + (i + 1) * stepInMs);
      });
    }
  }

  const numberOfIterationsStates = Math.ceil(
    numberOfSqliteStatesToDelete / this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
  );
  const iterator = [...Array(numberOfIterationsStates)];

  const numberOfIterationsStatesAggregates = Math.ceil(
    numberOfDeviceFeatureStateAggregateToDelete / this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
  );
  const iteratorAggregates = [...Array(numberOfIterationsStatesAggregates)];

  const total = sliceUpperBounds.length + numberOfIterationsStates + numberOfIterationsStatesAggregates;
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

  await Promise.each(sliceUpperBounds, async (sliceUpperBound) => {
    if (sliceUpperBound === null) {
      await db.duckDbWriteConnectionAllAsync(
        'DELETE FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID)',
        deviceFeatureId,
      );
    } else {
      await db.duckDbWriteConnectionAllAsync(
        'DELETE FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID) AND created_at < CAST(? AS TIMESTAMPTZ)',
        deviceFeatureId,
        sliceUpperBound.toISOString(),
      );
    }
    await updateProgressIfNeeded();
    await Promise.delay(this.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH);
  });

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

  if (iteratorAggregates.length > 0) {
    await this.job.updateProgress(jobId, currentProgressPercent, { step: 'deleting_aggregates' });
  }

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
