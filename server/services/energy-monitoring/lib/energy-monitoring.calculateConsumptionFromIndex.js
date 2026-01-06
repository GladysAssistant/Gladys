const Promise = require('bluebird');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { ENERGY_INDEX_FEATURE_TYPES } = require('../utils/constants');

const ENERGY_INDEX_LAST_PROCESSED = 'ENERGY_INDEX_LAST_PROCESSED';

/**
 * @description Calculate thirty-minute consumption from index differences for devices that have
 * INDEX features with corresponding THIRTY_MINUTES_CONSUMPTION features (linked via energy_parent_id).
 * @param {Date} thirtyMinutesWindowTime - The specific time for the thirty-minute window.
 * @param {Array} featureSelectors - Optional whitelist of consumption feature selectors to process.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateConsumptionFromIndex(new Date(), [], '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateConsumptionFromIndex(thirtyMinutesWindowTime, featureSelectors, jobId) {
  const isSelectorsArray = Array.isArray(featureSelectors);
  const selectors = isSelectorsArray ? featureSelectors.filter((s) => typeof s === 'string' && s.length > 0) : [];
  const selectorSet = new Set(selectors);
  const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  logger.info(`Calculating consumption from index in timezone ${systemTimezone} for window ${thirtyMinutesWindowTime}`);

  // Get all energy sensor devices
  const energyDevices = await this.gladys.device.get({
    device_feature_categories: Object.keys(ENERGY_INDEX_FEATURE_TYPES),
  });

  logger.info(`Found ${energyDevices.length} energy devices`);

  // Filter devices that have INDEX features with corresponding THIRTY_MINUTES_CONSUMPTION features
  // The consumption feature should have energy_parent_id pointing to the index feature
  const devicesWithBothFeatures = [];

  energyDevices.forEach((energyDevice) => {
    // Find all INDEX features in this device
    const indexFeatures = energyDevice.features.filter(
      (f) => ENERGY_INDEX_FEATURE_TYPES[f.category] && ENERGY_INDEX_FEATURE_TYPES[f.category].includes(f.type),
    );

    // For each INDEX feature, find the corresponding THIRTY_MINUTES_CONSUMPTION feature
    indexFeatures.forEach((indexFeature) => {
      const consumptionFeature = energyDevice.features.find(
        (f) =>
          f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
          f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION &&
          f.energy_parent_id === indexFeature.id,
      );

      if (consumptionFeature) {
        // If a whitelist is provided, only keep matches
        if (selectorSet.size > 0) {
          const consumptionSelector =
            consumptionFeature.selector || consumptionFeature.external_id || consumptionFeature.id;
          if (!selectorSet.has(consumptionSelector)) {
            return;
          }
        }
        devicesWithBothFeatures.push({
          device: energyDevice,
          indexFeature,
          consumptionFeature,
        });
      }
    });
  });

  logger.info(
    `Found ${devicesWithBothFeatures.length} devices with both INDEX and THIRTY_MINUTES_CONSUMPTION features`,
  );

  // Process each device
  await Promise.each(devicesWithBothFeatures, async (deviceInfo, index) => {
    try {
      const { device, indexFeature, consumptionFeature } = deviceInfo;

      // Calculate the 30-minute window boundaries
      const windowStart = dayjs(thirtyMinutesWindowTime)
        .subtract(30, 'minutes')
        .toDate();
      const windowEnd = dayjs(thirtyMinutesWindowTime).toDate();

      logger.debug(`Processing device ${device.name} for window ${windowStart} to ${windowEnd}`);

      // Get the last processed index timestamp from device parameters
      const lastProcessedParam = device.params.find((p) => p.name === ENERGY_INDEX_LAST_PROCESSED);
      let lastProcessedTimestamp;

      if (!lastProcessedParam || !lastProcessedParam.value) {
        logger.debug(`Device ${device.name}: no last processed timestamp, starting from ${windowStart}`);
        lastProcessedTimestamp = windowStart;
      } else {
        logger.debug(`Device ${device.name}: last processed timestamp: ${lastProcessedParam.value}`);
        lastProcessedTimestamp = new Date(lastProcessedParam.value);
      }

      logger.debug(`Device ${device.name}: last processed timestamp: ${lastProcessedTimestamp}`);

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

      // Calculate total consumption from all consecutive index differences
      let totalConsumption = 0;
      let lastValidIndex = null;
      let newLastProcessedTimestamp = lastProcessedTimestamp;

      for (let i = 0; i < indexStates.length; i += 1) {
        const currentState = indexStates[i];
        const currentIndex = currentState.value;
        const currentTimestamp = new Date(currentState.created_at);

        if (lastValidIndex !== null) {
          const consumption = currentIndex - lastValidIndex;

          // Handle consumption calculation and counter resets
          if (consumption >= 0) {
            totalConsumption += consumption;
            logger.debug(
              `Device ${device.name}: +${consumption} (${currentIndex} - ${lastValidIndex}) at ${currentTimestamp}`,
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
      await this.gladys.device.setParam(device, ENERGY_INDEX_LAST_PROCESSED, newLastProcessedTimestamp.toISOString());

      // Save the total consumption (always create historical state, even if 0)
      logger.debug(`Device ${device.name}: total consumption = ${totalConsumption}`);

      // Save the calculated consumption value
      await this.gladys.device.saveHistoricalState(consumptionFeature, totalConsumption, thirtyMinutesWindowTime);

      logger.info(`Saved consumption ${totalConsumption} for device ${device.name} at ${thirtyMinutesWindowTime}`);
    } catch (error) {
      logger.error(`Error processing device ${deviceInfo.device.name}:`, error);
    }

    // Update job progress
    if (jobId) {
      await this.gladys.job.updateProgress(jobId, Math.round(((index + 1) / devicesWithBothFeatures.length) * 100));
    }
  });

  logger.info(`Finished calculating consumption from index for ${devicesWithBothFeatures.length} devices`);
  if (jobId) {
    await this.gladys.job.updateProgress(jobId, 100);
  }
  return null;
}

module.exports = {
  calculateConsumptionFromIndex,
};
