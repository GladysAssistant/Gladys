const Promise = require('bluebird');
const db = require('../../models');
const { JOB_STATUS, JOB_ERROR_TYPES } = require('../../utils/constants');

/**
 * @public
 * @description Init.
 * @returns {Promise} Return updated job.
 * @example
 * gladys.job.init(');
 */
async function init() {
  // Purge old jobs
  await this.purge();
  // mark un-finished jobs as finished
  const unFinishedJobs = await db.Job.findAll({
    where: {
      status: JOB_STATUS.IN_PROGRESS,
    },
  });
  await Promise.map(
    unFinishedJobs,
    async (unFinishedJob) => {
      await this.finish(unFinishedJob.id, JOB_STATUS.FAILED, {
        error_type: JOB_ERROR_TYPES.PURGED_WHEN_RESTARTED,
      });
    },
    { concurrency: 2 },
  );
}

module.exports = {
  init,
};
