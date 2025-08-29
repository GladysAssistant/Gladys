const Promise = require('bluebird');
const { getDeviceFeature } = require('../../../utils/device');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, ENERGY_PRICE_TYPES } = require('../../../utils/constants');
const contracts = require('../contracts/contracts.calculateCost');

/**
 * @description Calculate energy monitoring cost from a specific date.
 * @param {Date} startAt - The start date.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateCostFrom(new Date());
 */
async function calculateCostFrom(startAt) {
  const energyDevices = await this.gladys.device.get({
    device_feature_category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  });
  logger.info(`Found ${energyDevices.length} energy devices`);
  await Promise.each(energyDevices, async (energyDevice) => {
    try {
      const energyConsumptionfeature = getDeviceFeature(
        energyDevice,
        DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      );
      if (!energyConsumptionfeature) {
        logger.debug(`Device ${energyDevice.name} has no thirty minutes consumption feature`);
        return;
      }
      const energyConsumptionCostFeature = getDeviceFeature(
        energyDevice,
        DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
      );
      if (!energyConsumptionCostFeature) {
        logger.debug(`Device ${energyDevice.name} has no thirty minutes consumption cost feature`);
        return;
      }
      const deviceFeatureStates = await this.gladys.device.getDeviceFeatureStates(
        energyConsumptionfeature.selector,
        startAt,
        new Date(),
      );
      await Promise.each(deviceFeatureStates, async (deviceFeatureState) => {
        // Get the feature of the root electrical meter device
        const electricMeterFeature = this.gladys.device.energySensorManager.getRootElectricMeterDevice(
          energyConsumptionfeature,
        );
        // Get the energy prices from this electrical meter device
        const energyPrices = await this.gladys.energyPrice.get({
          electric_meter_device_id: electricMeterFeature.device_id,
        });
        logger.debug(`Found ${energyPrices.length} energy prices for device ${electricMeterFeature.device_id}`);
        // Get the prices for this date
        const energyPricesForDate = energyPrices.filter(
          (price) =>
            // We only keep consumption prices (no subscription)
            price.price_type === ENERGY_PRICE_TYPES.CONSUMPTION &&
            // We only keep prices that are valid for this date
            new Date(price.start_date) <= deviceFeatureState.created_at &&
            (price.end_date === null || new Date(price.end_date) >= deviceFeatureState.created_at),
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
          deviceFeatureState.created_at,
          deviceFeatureState.value,
        );
        // Save the cost if not exists
        await this.gladys.device.saveHistoricalState(energyConsumptionCostFeature, cost, deviceFeatureState.created_at);
      });
    } catch (e) {
      logger.error(e);
    }
  });
  return null;
}

module.exports = {
  calculateCostFrom,
};
