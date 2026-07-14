const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @description One-shot cleanup of the DuckDB states which no longer belong to any
 * existing device feature (leftovers of features or devices deleted while the
 * per-feature purge was counting the wrong database). Started automatically once
 * at startup, and deliberately slow: the history is walked in weekly slices, and
 * after each slice the purge sleeps several times the duration the slice took
 * (duty cycle), so the CPU, the disk and the DuckDB write connection stay mostly
 * available for Gladys — there is no upfront count for the same reason.
 * @param {string} jobId - Id of the job.
 * @returns {Promise} Resolve with the number of purged states.
 * @example
 * await device.purgeOrphanedDuckDbStates();
 */
async function purgeOrphanedDuckDbStates(jobId) {
  // The flag is only set after a complete run: if Gladys restarts mid-purge,
  // the purge restarts at the next boot (deletes are idempotent).
  const alreadyPurged = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DUCKDB_ORPHANED_STATES_PURGED);
  if (alreadyPurged === 'true') {
    logger.info('Orphaned DuckDB states already purged. Not purging.');
    return null;
  }

  // Everything written after this date is out of scope: the feature list is
  // snapshotted below, so states written while the purge runs may belong to a
  // feature created after the snapshot and must never match the stale NOT IN
  // list. Future deletions are handled by the per-feature purge anyway.
  const purgeStartDate = new Date();

  const deviceFeatures = await db.DeviceFeature.findAll({ attributes: ['id'], raw: true });
  const featureIds = deviceFeatures.map((deviceFeature) => deviceFeature.id);

  // With no feature left, every state is orphaned
  let orphanedClause = '';
  if (featureIds.length > 0) {
    // The cast is on the parameters: without it, comparing VARCHAR parameters
    // against the UUID column can cost a per-row cast over the whole table.
    orphanedClause = ` AND device_feature_id NOT IN (${featureIds.map(() => 'CAST(? AS UUID)').join(',')})`;
  }

  // MIN/MAX over the whole table are answered from DuckDB statistics, this is fast
  const [{ min_date: minDate, max_date: maxDate }] = await db.duckDbReadConnectionAllAsync(
    'SELECT MIN(created_at) AS min_date, MAX(created_at) AS max_date FROM t_device_feature_state',
  );

  let numberOfOrphanedDuckDbStatesToDelete = 0;
  if (minDate !== null) {
    const startTime = new Date(minDate).getTime();
    // Clamped to the purge start date so no slice can ever reach beyond the
    // cutoff, even with future-dated states (skewed device clocks)
    const endTime = Math.min(new Date(maxDate).getTime(), purgeStartDate.getTime());
    const numberOfSlices = Math.max(1, Math.ceil((endTime - startTime) / ONE_WEEK_IN_MS));
    logger.info(`purge-orphaned-duckdb-states: starting, ${numberOfSlices} weekly slices to walk.`);

    await Promise.each([...Array(numberOfSlices)], async (value, i) => {
      const sliceStart = new Date(startTime + i * ONE_WEEK_IN_MS);
      // Every slice is bounded above — the last one by the purge start date, so
      // states written while the purge runs are never evaluated against the
      // stale feature snapshot
      const isLastSlice = i === numberOfSlices - 1;
      const sliceUpperBound = isLastSlice ? purgeStartDate : new Date(startTime + (i + 1) * ONE_WEEK_IN_MS);
      const sliceStartedAt = Date.now();
      const result = await db.duckDbWriteConnectionAllAsync(
        `DELETE FROM t_device_feature_state WHERE created_at >= CAST(? AS TIMESTAMPTZ) AND created_at < CAST(? AS TIMESTAMPTZ)${orphanedClause}`,
        sliceStart.toISOString(),
        sliceUpperBound.toISOString(),
        ...featureIds,
      );
      const sliceDurationInMs = Date.now() - sliceStartedAt;
      // DuckDB returns the number of deleted rows
      if (result && result[0] && result[0].Count !== undefined) {
        numberOfOrphanedDuckDbStatesToDelete += Number(result[0].Count);
      }
      await this.job.updateProgress(jobId, Math.round(((i + 1) * 100) / numberOfSlices));
      // Duty cycle: sleep several times the duration the slice took, so the
      // purge only ever uses a fraction of the CPU, the disk and the DuckDB
      // write connection, and Gladys stays responsive.
      const pauseInMs = Math.min(
        Math.max(
          sliceDurationInMs * this.ORPHANED_STATES_PURGE_PAUSE_FACTOR,
          this.ORPHANED_STATES_PURGE_MIN_PAUSE_IN_MS,
        ),
        60 * 1000,
      );
      logger.info(
        `purge-orphaned-duckdb-states: slice ${i + 1}/${numberOfSlices} (from ${sliceStart.toISOString()}):` +
          ` deleted ${result && result[0] && result[0].Count !== undefined ? Number(result[0].Count) : 0} states` +
          ` in ${sliceDurationInMs}ms, pausing ${pauseInMs}ms.`,
      );
      await Promise.delay(pauseInMs);
    });
  }

  // Flush the WAL and release the delete-tracking memory accumulated by the
  // mass deletes, so the space is reusable right away
  await db.duckDbWriteConnectionAllAsync('CHECKPOINT');

  logger.info(`purge-orphaned-duckdb-states: done, purged ${numberOfOrphanedDuckDbStatesToDelete} orphaned states.`);
  await this.variable.setValue(SYSTEM_VARIABLE_NAMES.DUCKDB_ORPHANED_STATES_PURGED, 'true');

  return {
    numberOfOrphanedDuckDbStatesToDelete,
  };
}

module.exports = {
  purgeOrphanedDuckDbStates,
};
