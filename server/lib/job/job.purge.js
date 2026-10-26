const { QueryTypes } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');

const MAX_JOBS_TO_KEEP = 2000;

/**
 * @public
 * @description Purge old jobs: only the 2000 most recent background jobs are kept.
 * @returns {Promise} Resolve.
 * @example
 * gladys.job.purge();
 */
async function purge() {
  logger.info(`Keeping only the ${MAX_JOBS_TO_KEEP} most recent background jobs`);
  await db.sequelize.query(
    `DELETE FROM t_job WHERE id IN (
      SELECT id FROM t_job
      ORDER BY created_at DESC, id DESC
      LIMIT -1 OFFSET :maxJobs
    )`,
    {
      replacements: { maxJobs: MAX_JOBS_TO_KEEP },
      type: QueryTypes.DELETE,
    },
  );
}

module.exports = {
  purge,
  MAX_JOBS_TO_KEEP,
};
