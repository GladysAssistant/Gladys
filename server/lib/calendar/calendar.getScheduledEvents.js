const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');
const { JOB_STATUS, JOB_TYPES } = require('../../utils/constants');

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
      type: JOB_TYPES.CALENDAR,
      data: name,
      status: JOB_STATUS.IN_PROGRESS,
      created_at: dayjs(job.nextInvocation()),
    });
  });
  return res;
}

module.exports = {
  getScheduledEvents,
};
