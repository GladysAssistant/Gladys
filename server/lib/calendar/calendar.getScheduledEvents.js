const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @description List calendar jobs.
 * @returns {Promise} Resolve when success.
 * @example
 * calendar.getScheduledEvents();
 */
async function getScheduledEvents() {
  // get timezone settings
  const { scheduledJobs } = this.schedule;
  const res = [];
  Object.entries(scheduledJobs).forEach((scheduledJob) => {
    const [name, job] = scheduledJob;
    res.push({
      name,
      nextInvocation: dayjs(job.nextInvocation()),
    });
  });
  return res;
}

module.exports = {
  getScheduledEvents,
};
