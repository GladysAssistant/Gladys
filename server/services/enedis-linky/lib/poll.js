const Promise = require('bluebird');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Poll a Linky meter
 * @param {Object} device - The meter to poll.
 * @returns {Promise} Promise.
 * @example
 * poll(device);
 */
async function poll(device) {
  const oneDayAgo = this.dayjs()
    .subtract(1, 'day')
    .format('YYYY-MM-DD');
  const today = this.dayjs().format('YYYY-MM-DD');

  const dailyEnergyFeature = device.features.find(
    (feature) =>
      feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
      feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
  );
  if (
    dailyEnergyFeature &&
    (!dailyEnergyFeature.last_value_changed ||
      this.dayjs(dailyEnergyFeature.last_value_changed).format('YYYY-MM-DD') !== today)
  ) {
    logger.debug(`enedis-linky: Checking if new data "${device.id}", emit feature "${dailyEnergyFeature.external_id}"`);
    const firstDay = !dailyEnergyFeature.last_value_changed
      ? this.dayjs()
          .subtract(3, 'month')
          .format('YYYY-MM-DD')
      : oneDayAgo;
    try {
      const { data } = await this.getDailyConsumption(device, firstDay, today);
      if (data) {
        logger.debug(
          `enedis-linky: Polling device "${device.id}", emit feature "${dailyEnergyFeature.external_id}" update`,
        );
        await Promise.map(
          data,
          ({ date, value }) => {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: dailyEnergyFeature.external_id,
              state: value,
              created_at: this.dayjs(date)
                .set('hour', 12)
                .format(),
            });
          },
          { concurrency: 1 },
        );
        await this.gladys.device.setDeviceFeatureAggregateDates({
          id: dailyEnergyFeature.id,
          last_monthly_aggregate: this.dayjs
            .tz(data[0].date, 'Europe/Paris')
            .set('date', 1)
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0),
          last_daily_aggregate: this.dayjs
            .tz(data[0].date, 'Europe/Paris')
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0),
          last_hourly_aggregate: this.dayjs
            .tz(data[0].date, 'Europe/Paris')
            .set('minute', 0)
            .set('second', 0),
        });
      }
    } catch (e) {
      logger.warn('Unable to poll daily Consumption');
      logger.debug(e);
    }
  }

  const hourlyPowerFeature = device.features.find(
    (feature) =>
      feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
      feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
  );
  if (
    hourlyPowerFeature &&
    (!hourlyPowerFeature.last_value_changed ||
      this.dayjs(hourlyPowerFeature.last_value_changed).format('YYYY-MM-DD') !== today)
  ) {
    logger.debug(`enedis-linky: Checking if new data "${device.id}", emit feature "${hourlyPowerFeature.external_id}"`);
    const firstDay = !hourlyPowerFeature.last_value_changed
      ? this.dayjs()
          .subtract(7, 'day')
          .format('YYYY-MM-DD')
      : oneDayAgo;
    try {
      const { data } = await this.getLoadCurve(device, firstDay, today);
      if (data) {
        logger.debug(
          `enedis-linky: Polling device "${device.id}", emit feature "${hourlyPowerFeature.external_id}" update`,
        );
        await Promise.map(
          data,
          ({ date, value }) => {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: hourlyPowerFeature.external_id,
              state: value,
              created_at: this.dayjs(date).format(),
            });
          },
          { concurrency: 1 },
        );
        await this.gladys.device.setDeviceFeatureAggregateDates({
          id: hourlyPowerFeature.id,
          last_monthly_aggregate: this.dayjs
            .tz(data[0].date, 'Europe/Paris')
            .set('date', 1)
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0),
          last_daily_aggregate: this.dayjs
            .tz(data[0].date, 'Europe/Paris')
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0),
          last_hourly_aggregate: this.dayjs
            .tz(data[0].date, 'Europe/Paris')
            .set('minute', 0)
            .set('second', 0),
        });
      }
    } catch (e) {
      logger.warn('Unable to poll load curve');
      logger.debug(e);
    }
  }
}

module.exports = {
  poll,
};
