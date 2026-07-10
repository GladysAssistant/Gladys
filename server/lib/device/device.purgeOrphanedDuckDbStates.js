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
  // The DuckDB connections process statements in order: when this probe
  // resolves, our turn on the read connection has arrived.
  await db.duckDbReadConnectionAllAsync('SELECT 1');
  await this.job.updateProgress(jobId, 0, { step: 'counting' });

  const deviceFeatures = await db.DeviceFeature.findAll({ attributes: ['id'], raw: true });
  const featureIds = deviceFeatures.map((deviceFeature) => deviceFeature.id);

  // With no feature left, every state is orphaned
  let whereClause = '';
  if (featureIds.length > 0) {
    whereClause = ` WHERE device_feature_id NOT IN (${featureIds.map(() => '?').join(',')})`;
  }

  const [{ count }] = await db.duckDbReadConnectionAllAsync(
    `SELECT COUNT(*) AS count FROM t_device_feature_state${whereClause}`,
    ...featureIds,
  );
  const numberOfOrphanedDuckDbStatesToDelete = Number(count);

  logger.info(`Purging orphaned DuckDB states: ${numberOfOrphanedDuckDbStatesToDelete} states to delete.`);

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
