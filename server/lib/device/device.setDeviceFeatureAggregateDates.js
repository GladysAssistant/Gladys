const db = require('../../models');

/**
 * @description Save new device feature aggregate dates in DB.
 * @param {Object} deviceFeature - A DeviceFeature to update.
 * @param {Object} deviceFeature.id - DeviceFeature id.
 * @param {Date} deviceFeature.last_monthly_aggregate - New last_monthly_aggregate value.
 * @param {Date} deviceFeature.last_daily_aggregate - New last_daily_aggregate value.
 * @param {Date} deviceFeature.last_hourly_aggregate - New last_hourly_aggregate value.
 * @example
 * setDeviceFeatureAggregateDates({
 *   id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *   last_monthly_aggregate: '2022-07-31T22:00:00+0200'
 *   last_daily_aggregate: '2022-08-01T22:00:00+0200'
 *   last_hourly_aggregate: '2022-08-01T22:00:00+0200'
 * });
 */
async function setDeviceFeatureAggregateDates({
  id,
  last_monthly_aggregate: lastMonthlyAggregate,
  last_daily_aggregate: lastDailyAggregate,
  last_hourly_aggregate: lastHourlyAggregate,
}) {
  return db.DeviceFeature.update(
    {
      ...(lastMonthlyAggregate && { last_monthly_aggregate: lastMonthlyAggregate }),
      ...(lastDailyAggregate && { last_daily_aggregate: lastDailyAggregate }),
      ...(lastHourlyAggregate && { last_hourly_aggregate: lastHourlyAggregate }),
    },
    {
      where: {
        id,
      },
    },
  );
}

module.exports = {
  setDeviceFeatureAggregateDates,
};
