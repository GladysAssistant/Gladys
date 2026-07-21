const Promise = require('bluebird');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { convertEnergyUnit } = require('../../../utils/units');
const { PRODUCTION_INDEX_FEATURE_TYPES } = require('../utils/constants');

const ENERGY_PRODUCTION_INDEX_LAST_PROCESSED = 'ENERGY_PRODUCTION_INDEX_LAST_PROCESSED';

/**
 * @description Calculate thirty-minute production from index differences for devices that have
 * production INDEX features with corresponding THIRTY_MINUTES_PRODUCTION features (linked via energy_parent_id).
 * @param {Date} thirtyMinutesWindowTime - The specific time for the thirty-minute window.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateProductionFromIndex(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateProductionFromIndex(thirtyMinutesWindowTime, jobId) {
  const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  logger.info(`Calculating production from index in timezone ${systemTimezone} for window ${thirtyMinutesWindowTime}`);

  // Get all energy production sensor devices
  const productionDevices = await this.gladys.device.get({
    device_feature_categories: Object.keys(PRODUCTION_INDEX_FEATURE_TYPES),
  });

  logger.info(`Found ${productionDevices.length} energy production devices`);

  // Filter devices that have INDEX features with corresponding THIRTY_MINUTES_PRODUCTION features
  // The production feature should have energy_parent_id pointing to the index feature
  const devicesWithBothFeatures = [];

  productionDevices.forEach((productionDevice) => {
    // Find all production INDEX features in this device
    const indexFeatures = productionDevice.features.filter(
      (f) => PRODUCTION_INDEX_FEATURE_TYPES[f.category] && PRODUCTION_INDEX_FEATURE_TYPES[f.category].includes(f.type),
    );

    // For each INDEX feature, find the corresponding THIRTY_MINUTES_PRODUCTION feature
    indexFeatures.forEach((indexFeature) => {
      const productionFeature = productionDevice.features.find(
        (f) =>
          f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR &&
          f.type === DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.THIRTY_MINUTES_PRODUCTION &&
          f.energy_parent_id === indexFeature.id,
      );

      if (productionFeature) {
        devicesWithBothFeatures.push({
          device: productionDevice,
          indexFeature,
          productionFeature,
        });
      }
    });
  });

  logger.info(`Found ${devicesWithBothFeatures.length} devices with both INDEX and THIRTY_MINUTES_PRODUCTION features`);

  // Process each device
  await Promise.each(devicesWithBothFeatures, async (deviceInfo, index) => {
    try {
      const { device, indexFeature, productionFeature } = deviceInfo;

      // Calculate the 30-minute window boundaries
      const windowStart = dayjs(thirtyMinutesWindowTime)
        .subtract(30, 'minutes')
        .toDate();
      const windowEnd = dayjs(thirtyMinutesWindowTime).toDate();

      logger.debug(`Processing device ${device.name} for window ${windowStart} to ${windowEnd}`);

      // Get the last processed index timestamp from device parameters
      const lastProcessedParam = device.params.find((p) => p.name === ENERGY_PRODUCTION_INDEX_LAST_PROCESSED);
      let lastProcessedTimestamp;

      if (!lastProcessedParam || !lastProcessedParam.value) {
        logger.debug(`Device ${device.name}: no last processed timestamp, starting from ${windowStart}`);
        lastProcessedTimestamp = windowStart;
      } else {
        logger.debug(`Device ${device.name}: last processed timestamp: ${lastProcessedParam.value}`);
        lastProcessedTimestamp = new Date(lastProcessedParam.value);
      }

      // Get all index states since the last processed timestamp up to the current window end
      const indexStates = await this.gladys.device.getDeviceFeatureStates(
        indexFeature.selector,
        lastProcessedTimestamp,
        windowEnd,
      );

      if (indexStates.length === 0) {
        logger.debug(`Device ${device.name}: no index states.`);
        return;
      }

      // Calculate total production from all consecutive index differences
      let totalProduction = 0;
      let lastValidIndex = null;
      let newLastProcessedTimestamp = lastProcessedTimestamp;

      for (let i = 0; i < indexStates.length; i += 1) {
        const currentState = indexStates[i];
        const currentIndex = currentState.value;
        const currentTimestamp = new Date(currentState.created_at);

        if (lastValidIndex !== null) {
          const production = currentIndex - lastValidIndex;

          // Handle production calculation and counter resets
          if (production >= 0) {
            const convertedProduction = convertEnergyUnit(production, indexFeature.unit, productionFeature.unit);
            totalProduction += convertedProduction;
            logger.debug(
              `Device ${device.name}: +${convertedProduction} (${currentIndex} - ${lastValidIndex}) at ${currentTimestamp}`,
            );
          } else {
            // Counter reset detected, do not count anything
            logger.warn(
              `Device ${device.name}: counter reset detected at ${currentTimestamp}, not counting negative value`,
            );
          }
        }

        lastValidIndex = currentIndex;
        newLastProcessedTimestamp = currentTimestamp;
      }

      // Update the last processed timestamp in device parameters
      await this.gladys.device.setParam(
        device,
        ENERGY_PRODUCTION_INDEX_LAST_PROCESSED,
        newLastProcessedTimestamp.toISOString(),
      );

      // Save the total production (always create historical state, even if 0)
      logger.debug(`Device ${device.name}: total production = ${totalProduction}`);

      // Save the calculated production value
      await this.gladys.device.saveHistoricalState(productionFeature, totalProduction, thirtyMinutesWindowTime);

      logger.info(`Saved production ${totalProduction} for device ${device.name} at ${thirtyMinutesWindowTime}`);
    } catch (error) {
      logger.error(`Error processing device ${deviceInfo.device.name}:`, error);
    }

    // Update job progress
    if (jobId) {
      await this.gladys.job.updateProgress(jobId, Math.round(((index + 1) / devicesWithBothFeatures.length) * 100));
    }
  });

  logger.info(`Finished calculating production from index for ${devicesWithBothFeatures.length} devices`);
  return null;
}

module.exports = {
  calculateProductionFromIndex,
};
