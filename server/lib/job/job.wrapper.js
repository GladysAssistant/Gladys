const { JOB_STATUS, JOB_ERROR_TYPES } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @public
 * @description Wrap a function so the surrounding code starts/finishes a job around its execution.
 * @param {string} type - Type of the job.
 * @param {Function} func - The function to wrap.
 * @param {object} [options] - Wrapper options.
 * @param {boolean} [options.detached=false] - When true, the wrapper starts the job, returns it
 *   immediately and runs `func` in the background; errors are reported on the job (status=FAILED)
 *   and never re-thrown. When false (default), the wrapper awaits `func` and re-throws on error.
 * @returns {Function} Wrapped function.
 * @example
 * gladys.job.wrapper('daily-aggregation', func);
 * gladys.job.wrapper('long-running-recalc', func, { detached: true });
 */
function wrapper(type, func, { detached = false } = {}) {
  return async (...args) => {
    const job = await this.start(type);

    const runAndFinish = async () => {
      try {
        const res = await func(...args, job.id);
        await this.finish(job.id, JOB_STATUS.SUCCESS);
        return res;
      } catch (error) {
        const data = {
          error_type: JOB_ERROR_TYPES.UNKNOWN_ERROR,
        };
        if (error && error.toString) {
          data.error = error.toString();
        }
        if (detached) {
          try {
            await this.finish(job.id, JOB_STATUS.FAILED, data);
          } catch (finishError) {
            logger.error(`job.wrapper: failed to finish job ${type}`, finishError);
          }
          return undefined;
        }
        await this.finish(job.id, JOB_STATUS.FAILED, data);
        throw error;
      }
    };

    if (detached) {
      runAndFinish();
      return job;
    }
    return runAndFinish();
  };
}

module.exports = {
  wrapper,
};
