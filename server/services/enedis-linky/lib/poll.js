const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { getDeviceFeature } = require('../../../utils/device');
const logger = require('../../../utils/logger');

/**
 * @description Poll a Linky meter
 * @param {Object} device - The meter to poll.
 * @example
 * poll(device);
 */
async function poll(device) {
  console.log('----poll', device)

  const oneDayAgo = this.dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const today = this.dayjs().format('YYYY-MM-DD');
  // if last value < hier -> conso depuis la derniere date, jusqu'à hier
  const dailyEnergyFeature = getDeviceFeature(
    device, DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR, DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY
  );
  console.log('dailyEnergyFeature', dailyEnergyFeature)
  if (
    dailyEnergyFeature
    && (!dailyEnergyFeature.last_value_changed
      || this.dayjs(dailyEnergyFeature.last_value_changed).format('YYYY-MM-DD') !== oneDayAgo)
  ) {
    try {
      const linkyJson = await this.getDailyConsumption(device, oneDayAgo, today);
      console.log('linkyJson', linkyJson)
    } catch (e) {
      logger.warn('Unable to poll daily Consumption');
      logger.debug(e);
    }
  }

  // conso depuis la derniere date jusqu'à aujourd'hui
  const hourlyPowerFeature = getDeviceFeature(
    device, DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR, DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER
  );
  if (
    hourlyPowerFeature
    && (!hourlyPowerFeature.last_value_changed
      || this.dayjs(hourlyPowerFeature.last_value_changed).isBefore() !== this.dayjs().toISOString())
  ) {
    try {
      const linkyHourJson = await this.getLoadCurve(device, oneDayAgo, today);
      console.log('linkyHourJson', linkyHourJson)
    } catch (e) {
      logger.warn('Unable to poll load curve');
      logger.debug(e);
    }
  }
}

module.exports = {
  poll,
};
