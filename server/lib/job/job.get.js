const dayjs = require('dayjs');
const db = require('../../models');
const { JOB_TYPES, JOB_STATUS } = require('../../utils/constants');

const DEFAULT_OPTIONS = {
  expand: [],
  skip: 0,
  order_by: 'created_at',
  order_dir: 'desc',
};

/**
 * @public
 * @description Get jobs
 * @param {Object} [options] - Options of the query.
 * @param {number} [options.take] - Number of elements to return.
 * @param {number} [options.skip] - Number of elements to skip.
 * @param {string} [options.order_by] - Order by.
 * @param {string} [options.order_dir] - Order dir (asc/desc).
 * @returns {Promise} Resolve with array of jobs.
 * @example
 * const jobs = await gladys.jobs.get();
 */
async function get(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);
  const queryParams = {
    raw: true,
    include: [],
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };
  if (optionsWithDefault.take !== undefined) {
    queryParams.limit = optionsWithDefault.take;
  }
  const jobs = await db.Job.findAll(queryParams);
  jobs.forEach((job) => {
    job.data = JSON.parse(job.data);
  });

  const { scheduledJobs } = this.schedule;
  Object.entries(scheduledJobs).forEach((scheduledJob) => {
    const [name, job] = scheduledJob;
    jobs.push({
      type: JOB_TYPES.CALENDAR,
      data: {
        name,
      },
      status: JOB_STATUS.IN_PROGRESS,
      created_at: dayjs(job.nextInvocation()),
    });
  });

  return jobs;
}

module.exports = {
  get,
};
