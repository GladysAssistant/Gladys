const db = require('../../models');
const { JOB_STATUS } = require('../../utils/constants');

/**
 * @public
 * @description Start a job
 * @param {string} type - Type of the job.
 * @param {Object} data - Data for the job.
 * @returns {Promise} Return created job.
 * @example
 * gladys.job.start('daily-aggregation');
 */
async function start(type, data = {}) {
  const job = await db.Job.create({
    type,
    status: JOB_STATUS.IN_PROGRESS,
    progress: 0,
    data,
  });
  return job;
}

module.exports = {
  start,
};
