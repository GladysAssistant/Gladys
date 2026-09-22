const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const logger = require('../../../utils/logger');
const db = require('../../../models');
const { queueWrapper } = require('../utils/queueWrapper');
const { getLocalContext, getBillingPeriodBounds, addDays } = require('../../../lib/energy-contract/tariff.time');
const { TARIFF_COMPONENT_KINDS } = require('../../../lib/energy-contract/tariff.constants');

dayjs.extend(utc);
dayjs.extend(timezone);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
// A billing period that ended in the last 3 days is (re)priced as closed: the demand
// charges are applied and the tier accumulations are final (section 7.4).
const CLOSED_PERIOD_LOOKBACK_DAYS = 3;
const DEFAULT_CALENDAR_RETENTION_DAYS = 3 * 365;

/**
 * @description Daily job (02:00 local): apply the demand charges of the billing periods that
 * just ended, and purge the calendar entries older than the oldest consumption state.
 * @param {string} [jobId] - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * await closeBillingPeriods();
 */
async function closeBillingPeriods(jobId) {
  return queueWrapper(this.queue, async () => {
    const now = Date.now();
    const contracts = await this.gladys.energyContract.get();
    const meters = new Map();
    contracts.forEach((contract) => {
      const hasDemand = (contract.tariff.components || []).some((c) => c.kind === TARIFF_COMPONENT_KINDS.DEMAND);
      if (!hasDemand) {
        return;
      }
      const { date } = getLocalContext(now, contract.timezone);
      const current = getBillingPeriodBounds(date, contract.billing_period_start_day || 1, contract.timezone);
      if (current.startMs > now - CLOSED_PERIOD_LOOKBACK_DAYS * ONE_DAY_MS) {
        // the previous period ended a few days ago: price it as closed
        const previousDate = addDays(current.id, -1);
        const previous = getBillingPeriodBounds(
          previousDate,
          contract.billing_period_start_day || 1,
          contract.timezone,
        );
        const from = meters.get(contract.electric_meter_device_id);
        if (from === undefined || previous.startMs < from) {
          meters.set(contract.electric_meter_device_id, previous.startMs);
        }
      }
    });
    if (meters.size > 0) {
      const from = new Date(Math.min(...Array.from(meters.values())));
      logger.info(`Closing the billing periods of ${meters.size} meter(s) from ${from.toISOString()}`);
      await this.calculateCostFrom(from, jobId, { electricMeterDeviceIds: Array.from(meters.keys()) });
    }
    // Calendar retention: the oldest consumption state minus one day (section 4).
    const [oldest] = await db.duckDbReadConnectionAllAsync(
      'SELECT MIN(created_at) AS oldest FROM t_device_feature_state',
    );
    const oldestMs =
      oldest && oldest.oldest ? new Date(oldest.oldest).getTime() : now - DEFAULT_CALENDAR_RETENTION_DAYS * ONE_DAY_MS;
    await this.gladys.energyContract.purgeCalendarEntries(new Date(oldestMs - ONE_DAY_MS));
    return null;
  });
}

module.exports = { closeBillingPeriods, CLOSED_PERIOD_LOOKBACK_DAYS };
