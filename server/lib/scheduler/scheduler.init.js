const logger = require('../../utils/logger');

const jobs = require('../../config/scheduler-jobs');

/**
 * @description Init event job scheduler.
 * @example
 * scheduler.initEventJobs();
 */
function init() {
  logger.debug(`Scheduler.init`);
  // foreach job
  jobs.forEach((job) => {
    // schedule it
    this.scheduleJob(job.rule, () => {
      logger.debug(`Running job "${job.name}" at ${new Date()}`);
      this.event.emit(job.event);
    });
  });
}

module.exports = {
  init,
};
