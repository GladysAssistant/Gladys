const Promise = require('bluebird');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const { getDeviceFeature } = require('../../../utils/device');
const logger = require('../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ENERGY_PRICE_TYPES,
  SYSTEM_VARIABLE_NAMES,
} = require('../../../utils/constants');
const contracts = require('../contracts/contracts.calculateCost');

/**
 * @description Calculate energy monitoring cost from a specific date.
 * @param {Date} startAt - The start date.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateCostFrom(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostFrom(startAt, jobId) {
  const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  logger.info(`Calculating cost in timezone ${systemTimezone}`);
  const energyDevices = await this.gladys.device.get({
    device_feature_category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  });
  logger.info(`Found ${energyDevices.length} energy devices`);
  await Promise.each(energyDevices, async (energyDevice, index) => {
    try {
      const energyConsumptionFeatures = [];

      // Find energy consumption feature 30 minutes
      const energyConsumptionfeature = getDeviceFeature(
        energyDevice,
        DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      );
      if (!energyConsumptionfeature) {
        logger.debug(`Device ${energyDevice.name} has no thirty minutes consumption feature`);
      } else {
        const energyConsumptionCostFeature = getDeviceFeature(
          energyDevice,
          DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
        );
        if (!energyConsumptionCostFeature) {
          logger.debug(`Device ${energyDevice.name} has no thirty minutes consumption cost feature`);
        } else {
          energyConsumptionFeatures.push({
            consumptionFeature: energyConsumptionfeature,
            consumptionCostFeature: energyConsumptionCostFeature,
          });
        }
      }

      // Find energy consumption feature daily, only if there are no thirty minutes consumption features
      // Otherwise, we'll calculate daily based on thirty minutes consumption features * 12
      if (energyConsumptionFeatures.length === 0) {
        const energyConsumptionDailyfeature = getDeviceFeature(
          energyDevice,
          DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
        );
        if (!energyConsumptionDailyfeature) {
          logger.debug(`Device ${energyDevice.name} has no daily consumption feature`);
        } else {
          const energyConsumptionDailyCostFeature = getDeviceFeature(
            energyDevice,
            DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
          );
          if (!energyConsumptionDailyCostFeature) {
            logger.debug(`Device ${energyDevice.name} has no daily consumption cost feature`);
          } else {
            energyConsumptionFeatures.push({
              consumptionFeature: energyConsumptionDailyfeature,
              consumptionCostFeature: energyConsumptionDailyCostFeature,
            });
          }
        }
      }

      // For each energy consumption feature
      await Promise.each(energyConsumptionFeatures, async (ecf) => {
        // Get the feature of the root electrical meter device
        const electricMeterFeature = this.gladys.device.energySensorManager.getRootElectricMeterDevice(
          ecf.consumptionFeature,
        );
        // Get the energy prices from this electrical meter device
        const energyPrices = await this.gladys.energyPrice.get({
          electric_meter_device_id: electricMeterFeature.device_id,
        });
        logger.debug(`Found ${energyPrices.length} energy prices for device ${electricMeterFeature.device_id}`);
        // We get all the states of the consumption feature in the time range
        const deviceFeatureStates = await this.gladys.device.getDeviceFeatureStates(
          ecf.consumptionFeature.selector,
          startAt,
          new Date(),
        );
        logger.debug(`Found ${deviceFeatureStates.length} states for device ${ecf.consumptionFeature.selector}`);
        // For each state
        await Promise.each(deviceFeatureStates, async (deviceFeatureState) => {
          const createdAtRemoved30Minutes = dayjs(deviceFeatureState.created_at)
            .subtract(30, 'minutes')
            .toDate();
          // Get the prices for this date
          const energyPricesForDate = energyPrices.filter(
            (price) =>
              // We only keep consumption prices (no subscription)
              price.price_type === ENERGY_PRICE_TYPES.CONSUMPTION &&
              // We only keep prices that are valid for this date
              dayjs.tz(price.start_date, systemTimezone).toDate() <= createdAtRemoved30Minutes &&
              (price.end_date === null ||
                dayjs.tz(price.end_date, systemTimezone).toDate() >= createdAtRemoved30Minutes),
          );
          if (energyPricesForDate.length === 0) {
            logger.debug(
              `No energy price found for device ${electricMeterFeature.device_id} at ${deviceFeatureState.created_at}`,
            );
            return;
          }
          // We take the contract from the first price.
          // It's not possible to have multiple contracts for the same electrical meter device.
          const { contract } = energyPricesForDate[0];
          // Calculate the cost per contract
          const cost = await contracts[contract](
            energyPricesForDate,
            createdAtRemoved30Minutes,
            deviceFeatureState.value,
          );
          // Save the cost if not exists
          await this.gladys.device.saveHistoricalState(ecf.consumptionCostFeature, cost, deviceFeatureState.created_at);
        });
      });
    } catch (e) {
      logger.error(e);
    }
    // Update the progress in percentage
    await this.gladys.job.updateProgress(jobId, Math.round(((index + 1) / energyDevices.length) * 100));
  });
  return null;
}

module.exports = {
  calculateCostFrom,
};
