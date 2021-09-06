const db = require('../../models');

const DEFAULT_OPTIONS = {
  expand: [],
  order_by: 'created_at',
  order_dir: 'desc',
};

/**
 * @public
 * @description Get jobs
 * @param {Object} [options] - Options of the query.
 * @param {Array} options.expand - Array of fields to expand.
 * @returns {Promise} Resolve with array of jobs.
 * @example
 * const jobs = await gladys.jobs.get();
 */
async function get(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);
  const queryParams = {
    raw: true,
    include: [],
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };
  return db.Job.findAll(queryParams);
}

module.exports = {
  get,
};
