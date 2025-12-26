const Promise = require('bluebird');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const { queueWrapper } = require('../utils/queueWrapper');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { ENERGY_INDEX_FEATURE_TYPES } = require('../utils/constants');

const ENERGY_INDEX_LAST_PROCESSED = 'ENERGY_INDEX_LAST_PROCESSED';

/**
 * @description Calculate consumption from index for all 30-minute windows from the beginning of the instance until now.
 * This function finds the oldest device state for energy index devices and processes all 30-minute windows.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateConsumptionFromIndexFromBeginning('12345678-1234-1234-1234-1234567890ab');
 */
async function calculateConsumptionFromIndexFromBeginning(jobId) {
  return queueWrapper(this.queue, async () => {
    const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
    logger.info(`Calculating consumption from index from beginning in timezone ${systemTimezone}`);

    // Get all energy sensor devices
    const energyDevices = await this.gladys.device.get({
      device_feature_categories: Object.keys(ENERGY_INDEX_FEATURE_TYPES),
    });

    logger.info(`Found ${energyDevices.length} energy devices`);

    // Filter devices that have both INDEX and THIRTY_MINUTES_CONSUMPTION features
    const devicesWithBothFeatures = [];

    energyDevices.forEach((energyDevice) => {
      const indexFeatures = energyDevice.features.filter(
        (f) => ENERGY_INDEX_FEATURE_TYPES[f.category] && ENERGY_INDEX_FEATURE_TYPES[f.category].includes(f.type),
      );

      const consumptionFeatures = energyDevice.features.filter(
        (f) =>
          f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
          f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      );

      if (indexFeatures.length > 0 && consumptionFeatures.length > 0) {
        devicesWithBothFeatures.push({
          device: energyDevice,
          indexFeatures,
        });
      }
    });

    await Promise.each(devicesWithBothFeatures, async (deviceWithBothFeatures) => {
      // Reset the last processed timestamp
      logger.debug(`Destroying last index processed for ${deviceWithBothFeatures.device.id}`);
      await this.gladys.device.destroyParam(deviceWithBothFeatures.device, ENERGY_INDEX_LAST_PROCESSED);
    });

    logger.info(
      `Found ${devicesWithBothFeatures.length} devices with both INDEX and THIRTY_MINUTES_CONSUMPTION features`,
    );

    if (devicesWithBothFeatures.length === 0) {
      logger.info('No devices found with both features, nothing to process');
      return null;
    }

    // Find the oldest device state across all index features using a direct SQL query
    const indexFeatureIds = devicesWithBothFeatures
      .map((deviceInfo) => deviceInfo.indexFeatures.map((f) => f.id))
      .flat();

    const result = await this.gladys.device.getOldestStateFromDeviceFeatures(indexFeatureIds);

    let oldestStateTime = null;

    if (result.length > 0 && result[0].oldest_created_at) {
      oldestStateTime = new Date(result[0].oldest_created_at);
    }

    if (!oldestStateTime) {
      logger.info('No device states found, nothing to process');
      return null;
    }

    logger.info(`Oldest device state found at: ${oldestStateTime}`);

    // Round the oldest time down to the nearest 30-minute mark
    const startTime = dayjs(oldestStateTime).tz(systemTimezone);
    const roundedStartTime = startTime
      .minute(startTime.minute() < 30 ? 0 : 30)
      .second(0)
      .millisecond(0);

    // Get current time and round up to the next 30-minute mark
    const now = dayjs().tz(systemTimezone);
    const currentMinute = now.minute();
    const roundedEndTime = now
      .minute(currentMinute < 30 ? 30 : 60)
      .second(0)
      .millisecond(0);

    logger.info(
      `Processing 30-minute windows from ${roundedStartTime.toISOString()} to ${roundedEndTime.toISOString()}`,
    );

    // Generate all 30-minute windows
    const windows = [];
    let currentWindow = roundedStartTime;

    while (currentWindow.isBefore(roundedEndTime)) {
      windows.push(currentWindow.toDate());
      currentWindow = currentWindow.add(30, 'minute');
    }

    logger.info(`Generated ${windows.length} thirty-minute windows to process`);

    // Process each window sequentially
    let processedWindows = 0;
    let successfulWindows = 0;
    let failedWindows = 0;

    await Promise.each(windows, async (windowTime) => {
      try {
        // Call the existing calculateConsumptionFromIndex function for each window
        await this.calculateConsumptionFromIndex(windowTime);
        successfulWindows += 1;

        // Update job progress
        processedWindows += 1;
        const progressPercentage = Math.round((processedWindows / windows.length) * 100);
        await this.gladys.job.updateProgress(jobId, progressPercentage);

        logger.debug(`Processed window ${processedWindows}/${windows.length}: ${windowTime.toISOString()}`);
      } catch (error) {
        failedWindows += 1;
        logger.error(`Error processing window ${windowTime.toISOString()}:`, error);

        // Continue processing other windows even if one fails
        processedWindows += 1;
        const progressPercentage = Math.round((processedWindows / windows.length) * 100);
        await this.gladys.job.updateProgress(jobId, progressPercentage);
      }
    });

    logger.info(
      `Finished processing all windows. Successful: ${successfulWindows}, Failed: ${failedWindows}, Total: ${windows.length}`,
    );

    return null;
  });
}

module.exports = {
  calculateConsumptionFromIndexFromBeginning,
};
