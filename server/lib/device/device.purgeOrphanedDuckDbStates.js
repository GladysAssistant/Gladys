const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * @description One-shot cleanup of the DuckDB states which no longer belong to any
 * existing device feature (leftovers of features or devices deleted while the
 * per-feature purge was counting the wrong database). Started automatically once
 * at startup, and deliberately slow: the history is walked in monthly slices with
 * a pause between each, so no DuckDB connection is ever held for long and Gladys
 * is never blocked — there is no upfront count for the same reason.
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
    const endTime = new Date(maxDate).getTime();
    const numberOfSlices = Math.max(1, Math.ceil((endTime - startTime) / ONE_MONTH_IN_MS));
    logger.info(`Purging orphaned DuckDB states in ${numberOfSlices} monthly slices.`);

    await Promise.each([...Array(numberOfSlices)], async (value, i) => {
      const sliceStart = new Date(startTime + i * ONE_MONTH_IN_MS);
      // The last slice has no upper bound, so states written while the purge
      // was running are covered too
      const isLastSlice = i === numberOfSlices - 1;
      const upperBoundClause = isLastSlice ? '' : ' AND created_at < CAST(? AS TIMESTAMPTZ)';
      const queryParams = [sliceStart.toISOString()];
      if (!isLastSlice) {
        queryParams.push(new Date(startTime + (i + 1) * ONE_MONTH_IN_MS).toISOString());
      }
      const result = await db.duckDbWriteConnectionAllAsync(
        `DELETE FROM t_device_feature_state WHERE created_at >= CAST(? AS TIMESTAMPTZ)${upperBoundClause}${orphanedClause}`,
        ...queryParams,
        ...featureIds,
      );
      // DuckDB returns the number of deleted rows
      if (result && result[0] && result[0].Count !== undefined) {
        numberOfOrphanedDuckDbStatesToDelete += Number(result[0].Count);
      }
      await this.job.updateProgress(jobId, Math.round(((i + 1) * 100) / numberOfSlices));
      await Promise.delay(this.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH);
    });
  }

  logger.info(`Purged ${numberOfOrphanedDuckDbStatesToDelete} orphaned DuckDB states.`);
  await this.variable.setValue(SYSTEM_VARIABLE_NAMES.DUCKDB_ORPHANED_STATES_PURGED, 'true');

  return {
    numberOfOrphanedDuckDbStatesToDelete,
  };
}

module.exports = {
  purgeOrphanedDuckDbStates,
};
