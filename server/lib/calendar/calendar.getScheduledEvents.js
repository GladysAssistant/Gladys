const dayjs = require('dayjs');

/**
 * @description List calendar jobs.
 * @returns {Promise} Resolve when success.
 * @example
 * calendar.getScheduledEvents();
 */
async function getScheduledEvents() {
  const { scheduledJobs } = this.schedule;
  const res = [];
  Object.entries(scheduledJobs).forEach((jobEntry) => {
    const [name, job] = jobEntry;
    res.push({
      name,
      nextInvocation: dayjs(job.nextInvocation())
    });
  });
  return res;
}

module.exports = {
  getScheduledEvents,
};
