const dayjs = require('dayjs');
const schedule = require('node-schedule');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = require('../../../utils/logger');
const { SYSTEM_VARIABLE_NAMES, EVENTS } = require('../../../utils/constants');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');

/**
 * @description Init energy monitoring scheduled sync.
 * @returns {null} Return when scheduled.
 * @example
 * init();
 */
async function init() {
  const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  if (!this.recalculateForContractsListener) {
    // contract or calendar change: the core asks for a bounded recalculation (spec 7.4)
    this.recalculateForContractsListener = eventFunctionWrapper(this.recalculateForContracts);
    this.gladys.event.on(EVENTS.ENERGY_CONTRACT.RECALCULATE, this.recalculateForContractsListener);
    // the migration of the legacy prices ran before this service listened: run its recalculation
    try {
      const pending = await this.gladys.energyContract.takePendingRecalculation();
      if (pending) {
        this.recalculateForContracts(pending).catch((e) =>
          logger.warn(`Pending energy recalculation failed: ${e.message}`),
        );
      }
    } catch (e) {
      logger.warn(`Unable to read the pending energy recalculation: ${e.message}`);
    }
  }
  if (!this.calculateConsumptionAndCostEvery30MinutesJob) {
    // Scheduling consumption and cost calculation every 30 minutes
    this.calculateConsumptionAndCostEvery30MinutesJob = this.gladys.scheduler.scheduleJob(
      `0 0,30 * * * *`,
      async () => {
        // Calculate the exact 30-minute window time (current time rounded to 00:00 or 00:30)
        const now = new Date();

        // Add to queue
        await this.calculateConsumptionFromIndexThirtyMinutes(now);
        await this.calculateProductionFromIndexThirtyMinutes(now);
        await this.calculateCostEveryThirtyMinutes(now);
        await this.delegatedCatchUp();
        // price-changed scene trigger (spec 8.2): never blocks the job
        try {
          await this.gladys.energyContract.checkPriceChanges();
        } catch (e) {
          logger.warn(`Energy monitoring: unable to check the contract price changes: ${e.message}`);
        }
      },
    );
  }
  // Billing period end: demand charges of the elapsed period, calendar retention (spec 7.4)
  if (!this.closeBillingPeriodsJob) {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 2;
    rule.minute = 0;
    rule.tz = systemTimezone;
    this.closeBillingPeriodsJob = this.gladys.scheduler.scheduleJob(rule, async () => {
      await this.closeBillingPeriods();
    });
  }
  // Re-calculate yesterday at 11 AM (useful for enedis)
  if (!this.calculateConsumptionAndCostEvery24HoursJob) {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 11;
    rule.minute = 10;
    rule.tz = systemTimezone;
    // Scheduling consumption and cost calculation every day at 11:10
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

  // Re-calculate yesterday at 16:10 (useful for late enedis data)
  if (!this.calculateConsumptionAndCostEvery24HoursLastJob) {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 16;
    rule.minute = 10;
    rule.tz = systemTimezone;
    // Scheduling consumption and cost calculation every day at 16:10
    this.calculateConsumptionAndCostEvery24HoursLastJob = this.gladys.scheduler.scheduleJob(rule, async () => {
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
