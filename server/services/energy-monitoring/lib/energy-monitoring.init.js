const dayjs = require('dayjs');
const schedule = require('node-schedule');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

/**
 * @description Init energy monitoring scheduled sync.
 * @returns {null} Return when scheduled.
 * @example
 * init();
 */
async function init() {
  const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  if (!this.calculateConsumptionAndCostEvery30MinutesJob) {
    // Scheduling consumption and cost calculation every 30 minutes
    this.calculateConsumptionAndCostEvery30MinutesJob = this.gladys.scheduler.scheduleJob(
      `0 0,30 * * * *`,
      async () => {
        // Calculate the exact 30-minute window time (current time rounded to 00:00 or 00:30)
        const now = new Date();

        // Add to queue
        await this.calculateConsumptionFromIndexThirtyMinutes(now);
        await this.calculateCostEveryThirtyMinutes(now);
      },
    );
  }
  // Re-calculate yesterday at 11 AM (useful for enedis)
  if (!this.calculateConsumptionAndCostEvery24HoursJob) {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 11;
    rule.minute = 10;
    rule.tz = systemTimezone;
    // Scheduling consumption and cost calculation every day at 9AM
    this.calculateConsumptionAndCostEvery24HoursJob = this.gladys.scheduler.scheduleJob(rule, async () => {
      const yesterdayDate = dayjs
        .tz(dayjs(), systemTimezone)
        .subtract(1, 'day')
        .startOf('day')
        .toDate();

      // Add to queue
      await this.calculateCostFromYesterday(yesterdayDate);
    });
  }

  return null;
}

module.exports = {
  init,
};
