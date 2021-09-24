const { JOB_STATUS } = require('../../utils/constants');

/**
 * @public
 * @description Start a job
 * @param {string} type - Type of the job.
 * @param {Function} func - The function to wrap.
 * @returns {Function} Return function.
 * @example
 * gladys.job.wrapper('daily-aggregation', func);
 */
function wrapper(type, func) {
  return async (...args) => {
    let job;
    try {
      job = await this.start(type);
      await func(...args, job.id);
      await this.finish(job.id, JOB_STATUS.SUCCESS);
    } catch (error) {
      if (job) {
        const data = {};
        if (error && error.toString) {
          data.error = error.toString();
        }
        await this.finish(job.id, JOB_STATUS.FAILED, data);
      }
      throw error;
    }
  };
}

module.exports = {
  wrapper,
};
