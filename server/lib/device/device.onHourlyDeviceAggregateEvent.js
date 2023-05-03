const { JOB_TYPES } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description It's time to do the daily device state aggregate.
 * @example
 * onHourlyDeviceAggregateEvent()
 */
async function onHourlyDeviceAggregateEvent() {
  const startHourlyAggregate = this.job.wrapper(JOB_TYPES.HOURLY_DEVICE_STATE_AGGREGATE, async (jobId) => {
    await this.calculateAggregate('hourly', jobId);
  });
  const startDailyAggregate = this.job.wrapper(JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE, async (jobId) => {
    await this.calculateAggregate('daily', jobId);
  });
  const startMonthlyAggregate = this.job.wrapper(JOB_TYPES.MONTHLY_DEVICE_STATE_AGGREGATE, async (jobId) => {
    await this.calculateAggregate('monthly', jobId);
  });
  try {
    await startHourlyAggregate();
  } catch (e) {
    logger.error(e);
  }
  try {
    await startDailyAggregate();
  } catch (e) {
    logger.error(e);
  }
  try {
    await startMonthlyAggregate();
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  onHourlyDeviceAggregateEvent,
};
