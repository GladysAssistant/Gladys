const { JOB_STATUS, JOB_ERROR_TYPES } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @public
 * @description Wrap a function so the surrounding code starts/finishes a job around its execution.
 * @param {string} type - Type of the job.
 * @param {Function} func - The function to wrap.
 * @param {object} [options] - Wrapper options.
 * @param {boolean} [options.detached=false] - When false (default), the wrapper awaits
 *   `func` and re-throws any error to the caller (legacy behavior). When true, the wrapper
 *   starts the job, returns it immediately, and runs `func` in the background; errors are
 *   reported on the job (status=FAILED) and never re-thrown to the caller.
 * @returns {Function} Wrapped function.
 * @example
 * gladys.job.wrapper('daily-aggregation', func);
 * gladys.job.wrapper('long-running-recalc', func, { detached: true });
 */
function wrapper(type, func, { detached = false } = {}) {
  return async (...args) => {
    if (detached) {
      // Fire-and-forget: start the job, run func in background, never throw to the caller.
      const job = await this.start(type);
      (async () => {
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
            logger.error(`job.wrapper: failed to finish job ${type}`, finishError);
          }
        }
      })();
      return job;
    }

    // Legacy synchronous mode (behavior strictly preserved).
    let job;
    try {
      job = await this.start(type);
      const res = await func(...args, job.id);
      await this.finish(job.id, JOB_STATUS.SUCCESS);
      return res;
    } catch (error) {
      if (job) {
        const data = {
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

module.exports = {
  wrapper,
};
