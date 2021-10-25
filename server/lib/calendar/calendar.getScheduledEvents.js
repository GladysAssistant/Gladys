const dayjs = require('dayjs');
const logger = require('../../utils/logger');

/**
 * @description List calendar jobs.
 * @returns {Promise} Resolve when success.
 * @example
 * calendar.getScheduledEvents();
 */
async function getScheduledEvents() {
  const { scheduledJobs } = this.schedule;
  Object.entries(scheduledJobs).forEach((jobEntry) => {
    const [name, job] = jobEntry;
    logger.info(`Schedule job: ${name} at ${dayjs(job.nextInvocation())}`);
  });
  return {
    scheduledJobs,
    jobs: this.jobs,
  };
}

module.exports = {
  getScheduledEvents,
};
