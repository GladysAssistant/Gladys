const { JOB_STATUS, JOB_ERROR_TYPES } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @public
 * @description Start a job.
 * @param {string} type - Type of the job.
 * @param {Function} func - The function to wrap.
 * @param {object} [options] - Optional wrapper options.
 * @param {Function} [options.buildJobData] - Optional async function to build job data from args.
 * @returns {Function} Return function.
 * @example
 * gladys.job.wrapper('daily-aggregation', func, { buildJobData: (args) => ({ scope: 'all' }) });
 */
function wrapper(type, func, options = {}) {
  return async (...args) => {
    let job;
    let jobData = {};
    if (options.buildJobData) {
      try {
        const maybeData = await options.buildJobData.apply(this, args);
        if (maybeData && typeof maybeData === 'object') {
          jobData = maybeData;
        }
      } catch (e) {
        logger.warn(`job.wrapper: buildJobData failed for job ${type}`, e);
      }
    }
    try {
      job = await this.start(type, jobData);
      const res = await func(...args, job.id);
      await this.finish(job.id, JOB_STATUS.SUCCESS);
      return res;
    } catch (error) {
      if (job) {
        const data = {
          ...(job.data || {}),
          error_type: JOB_ERROR_TYPES.UNKNOWN_ERROR,
        };
        if (error && error.toString) {
          data.error = error.toString();
        }
        await this.finish(job.id, JOB_STATUS.FAILED, data);
      }
      throw error;
    }
  };
}

/**
 * @public
 * @description Start a job and run it in background without awaiting completion.
 * @param {string} type - Type of the job.
 * @param {Function} func - The function to wrap.
 * @param {object} [options] - Optional wrapper options.
 * @param {Function} [options.buildJobData] - Optional async function to build job data from args.
 * @returns {Function} Return function that resolves when job is started.
 * @example
 * gladys.job.wrapperDetached('daily-aggregation', func, { buildJobData: (args) => ({ scope: 'all' }) });
 */
function wrapperDetached(type, func, options = {}) {
  return async (...args) => {
    let jobData = {};
    if (options.buildJobData) {
      try {
        const maybeData = await options.buildJobData.apply(this, args);
        if (maybeData && typeof maybeData === 'object') {
          jobData = maybeData;
        }
      } catch (e) {
        logger.warn(`job.wrapperDetached: buildJobData failed for job ${type}`, e);
      }
    }
    const job = await this.start(type, jobData);

    const runJob = async () => {
      try {
        await func(...args, job.id);
        await this.finish(job.id, JOB_STATUS.SUCCESS);
      } catch (error) {
        const data = {
          ...(job.data || {}),
          error_type: JOB_ERROR_TYPES.UNKNOWN_ERROR,
        };
        if (error && error.toString) {
          data.error = error.toString();
        }
        try {
          await this.finish(job.id, JOB_STATUS.FAILED, data);
        } catch (finishError) {
          logger.error(`job.wrapperDetached: failed to finish job ${type}`, finishError);
        }
      }
    };

    runJob();

    return job;
  };
}

module.exports = {
  wrapper,
  wrapperDetached,
};
