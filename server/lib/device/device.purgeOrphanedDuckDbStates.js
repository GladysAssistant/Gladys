const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Purge DuckDB states which no longer belong to any existing device feature
 * (leftovers of features or devices deleted while the per-feature purge was broken).
 * @param {string} jobId - Id of the job.
 * @returns {Promise} Resolve with the number of purged states.
 * @example
 * await device.purgeOrphanedDuckDbStates();
 */
async function purgeOrphanedDuckDbStates(jobId) {
  await this.job.updateProgress(jobId, 0, { step: 'waiting_database' });

  const deviceFeatures = await db.DeviceFeature.findAll({ attributes: ['id'], raw: true });
  const featureIds = deviceFeatures.map((deviceFeature) => deviceFeature.id);

  // With no feature left, every state is orphaned
  let whereClause = '';
  if (featureIds.length > 0) {
    // The cast is on the parameters: without it, comparing VARCHAR parameters
    // against the UUID column can cost a per-row cast over the whole table.
    whereClause = ` WHERE device_feature_id NOT IN (${featureIds.map(() => 'CAST(? AS UUID)').join(',')})`;
  }

  // The DuckDB connection is FIFO: submit the probe and the real query in the
  // same tick, so the probe resolving means the count is actually running,
  // not merely queued behind another job.
  const waitStartedAt = Date.now();
  const probePromise = db.duckDbReadConnectionAllAsync('SELECT 1');
  const countPromise = db.duckDbReadConnectionAllAsync(
    `SELECT COUNT(*) AS count FROM t_device_feature_state${whereClause}`,
    ...featureIds,
  );
  await probePromise;
  const countStartedAt = Date.now();
  await this.job.updateProgress(jobId, 0, { step: 'counting' });
  const [{ count }] = await countPromise;
  const numberOfOrphanedDuckDbStatesToDelete = Number(count);

  logger.info(
    `Purging orphaned DuckDB states: waited ${countStartedAt - waitStartedAt}ms for the read connection,` +
      ` counted ${numberOfOrphanedDuckDbStatesToDelete} orphaned states in ${Date.now() - countStartedAt}ms.`,
  );

  await this.job.updateProgress(jobId, 0, {
    orphaned_states_count: numberOfOrphanedDuckDbStatesToDelete,
    step: 'waiting_database',
  });
  // Same probe on the write connection: the delete may have to wait behind
  // another purge already deleting.
  await db.duckDbWriteConnectionAllAsync('SELECT 1');
  await this.job.updateProgress(jobId, 0, { step: 'deleting_states' });

  if (numberOfOrphanedDuckDbStatesToDelete > 0) {
    await db.duckDbWriteConnectionAllAsync(`DELETE FROM t_device_feature_state${whereClause}`, ...featureIds);
  }

  await this.job.updateProgress(jobId, 100);

  return {
    numberOfOrphanedDuckDbStatesToDelete,
  };
}

module.exports = {
  purgeOrphanedDuckDbStates,
};
