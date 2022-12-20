const db = require('../../models');

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
  const optionsWithDefault = { ...DEFAULT_OPTIONS, ...options };
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
  return jobs;
}

module.exports = {
  get,
};
