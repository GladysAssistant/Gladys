const Promise = require('bluebird');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = require('../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  ENERGY_PRICE_TYPES,
  ENERGY_CONTRACT_TYPES,
  SYSTEM_VARIABLE_NAMES,
} = require('../../../utils/constants');
const contracts = require('../contracts/contracts.calculateCost');
const { buildEdfTempoDayMap } = require('../contracts/contracts.buildEdfTempoDayMap');

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
  let edfTempoHistoricalMap = null;
  await Promise.each(energyDevices, async (energyDevice, index) => {
    try {
      const energyConsumptionFeatures = [];

      // Find all THIRTY_MINUTES_CONSUMPTION features
      const thirtyMinConsumptionFeatures = energyDevice.features.filter(
        (f) =>
          f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
          f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      );

      // For each consumption feature, find the corresponding cost feature (linked via energy_parent_id)
      thirtyMinConsumptionFeatures.forEach((consumptionFeature) => {
        const costFeature = energyDevice.features.find(
          (f) =>
            f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
            f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST &&
            f.energy_parent_id === consumptionFeature.id,
        );

        if (costFeature) {
          energyConsumptionFeatures.push({
            consumptionFeature,
            consumptionCostFeature: costFeature,
          });
        } else {
          logger.debug(
            `Device ${energyDevice.name}: consumption feature ${consumptionFeature.id} has no linked cost feature`,
          );
        }
      });

      // Find energy consumption feature daily, only if there are no thirty minutes consumption features
      // Otherwise, we'll calculate daily based on thirty minutes consumption features * 12
      if (energyConsumptionFeatures.length === 0) {
        // Find all DAILY_CONSUMPTION features
        const dailyConsumptionFeatures = energyDevice.features.filter(
          (f) =>
            f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
            f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
        );

        // For each daily consumption feature, find the corresponding cost feature (linked via energy_parent_id)
        dailyConsumptionFeatures.forEach((consumptionFeature) => {
          const costFeature = energyDevice.features.find(
            (f) =>
              f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
              f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST &&
              f.energy_parent_id === consumptionFeature.id,
          );

          if (costFeature) {
            energyConsumptionFeatures.push({
              consumptionFeature,
              consumptionCostFeature: costFeature,
            });
          } else {
            logger.debug(
              `Device ${energyDevice.name}: daily consumption feature ${consumptionFeature.id} has no linked cost feature`,
            );
          }
        });
      }

      // For each energy consumption feature
      await Promise.each(energyConsumptionFeatures, async (ecf) => {
        // First, clean the cost feature states
        logger.debug(`Destroying states from ${ecf.consumptionCostFeature.selector} from ${startAt}`);
        await this.gladys.device.destroyStatesFrom(ecf.consumptionCostFeature.selector, startAt);
        // Get the feature of the root electrical meter device
        const electricMeterFeature = this.gladys.device.energySensorManager.getRootElectricMeterDevice(
          ecf.consumptionFeature,
        );
        // Get the energy prices from this electrical meter device
        const energyPrices = await this.gladys.energyPrice.get({
          electric_meter_device_id: electricMeterFeature.device_id,
        });
        const hasTempo = energyPrices.some((p) => p.contract === ENERGY_CONTRACT_TYPES.EDF_TEMPO);
        if (hasTempo && !edfTempoHistoricalMap) {
          logger.info(
            `Device ${electricMeterFeature.device_id} has tempo prices and Map is empty, getting EDF tempo historical`,
          );
          const startDateAsDayString = dayjs.tz(startAt, systemTimezone).format('YYYY-MM-DD');
          edfTempoHistoricalMap = await buildEdfTempoDayMap(this.gladys, startDateAsDayString);
        }
        logger.debug(`Found ${energyPrices.length} energy prices for device ${electricMeterFeature.device_id}`);
        // We get all the states of the consumption feature in the time range
        const deviceFeatureStates = await this.gladys.device.getDeviceFeatureStates(
          ecf.consumptionFeature.selector,
          startAt,
          new Date(),
        );
        const deviceFeatureCostStatesToInsert = [];
        logger.debug(`Found ${deviceFeatureStates.length} states for device ${ecf.consumptionFeature.selector}`);
        // For each state
        await Promise.each(deviceFeatureStates, async (deviceFeatureState) => {
          const createdAtRemoved30Minutes = dayjs
            .tz(deviceFeatureState.created_at, systemTimezone)
            .subtract(30, 'minutes')
            .toDate();
          // Get the prices for this date
          const energyPricesForDate = energyPrices.filter((price) => {
            // We only keep consumption prices (no subscription)
            return (
              price.price_type === ENERGY_PRICE_TYPES.CONSUMPTION &&
              // We only keep prices that are valid for this date
              dayjs.tz(`${price.start_date} 00:00:00`, systemTimezone).toDate() <= createdAtRemoved30Minutes &&
              (price.end_date === null ||
                dayjs.tz(`${price.end_date} 23:59:59`, systemTimezone).toDate() >= createdAtRemoved30Minutes)
            );
          });
          if (energyPricesForDate.length === 0) {
            logger.debug(
              `No energy price found for device ${electricMeterFeature.device_id} at ${deviceFeatureState.created_at}`,
            );
            return;
          }

          // We take the contract from the first price.
          // It's not possible to have multiple contracts for the same electrical meter device.
          const { contract } = energyPricesForDate[0];

          // Convert the value in the correct unit
          let valueInKwh = deviceFeatureState.value;

          if (ecf.consumptionFeature.unit === DEVICE_FEATURE_UNITS.WATT_HOUR) {
            valueInKwh = deviceFeatureState.value / 1000;
          }

          // Calculate the cost per contract
          const cost = await contracts[contract](
            energyPricesForDate,
            createdAtRemoved30Minutes,
            valueInKwh,
            systemTimezone,
            { edfTempoHistoricalMap },
          );
          deviceFeatureCostStatesToInsert.push({
            value: cost,
            created_at: deviceFeatureState.created_at,
          });
        });

        // Save all the cost in DB at once
        await this.gladys.device.saveMultipleHistoricalStates(
          ecf.consumptionCostFeature.id,
          deviceFeatureCostStatesToInsert,
        );
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
