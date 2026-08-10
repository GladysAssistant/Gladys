const Promise = require('bluebird');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const { queueWrapper } = require('../utils/queueWrapper');
const logger = require('../../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

/**
 * @description Calculate energy (consumption or production, depending on the kind) from index
 * for all 30-minute windows from the beginning of the instance until now.
 * This function finds the oldest device state for index devices and processes all 30-minute windows.
 * @param {object} kind - One of ENERGY_FROM_INDEX_KINDS (consumption or production).
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateEnergyFromIndexFromBeginning(ENERGY_FROM_INDEX_KINDS.CONSUMPTION, '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateEnergyFromIndexFromBeginning(kind, jobId) {
  return queueWrapper(this.queue, async () => {
    const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
    logger.info(`Calculating ${kind.name} from index from beginning in timezone ${systemTimezone}`);

    // Get all devices that can carry this kind of index feature
    const energyDevices = await this.gladys.device.get({
      device_feature_categories: Object.keys(kind.indexFeatureTypes),
    });

    logger.info(`Found ${energyDevices.length} energy devices`);

    // Filter devices that have both INDEX and thirty-minutes features
    const devicesWithBothFeatures = [];

    energyDevices.forEach((energyDevice) => {
      const indexFeatures = energyDevice.features.filter(
        (f) => kind.indexFeatureTypes[f.category] && kind.indexFeatureTypes[f.category].includes(f.type),
      );

      const targetFeatures = energyDevice.features.filter(
        (f) => f.category === kind.targetFeatureCategory && f.type === kind.targetFeatureType,
      );

      if (indexFeatures.length > 0 && targetFeatures.length > 0) {
        devicesWithBothFeatures.push({
          device: energyDevice,
          indexFeatures,
        });
      }
    });

    await Promise.each(devicesWithBothFeatures, async (deviceWithBothFeatures) => {
      // Reset the last processed timestamp
      logger.debug(`Destroying last index processed for ${deviceWithBothFeatures.device.id}`);
      await this.gladys.device.destroyParam(deviceWithBothFeatures.device, kind.lastProcessedParamName);
    });

    logger.info(
      `Found ${devicesWithBothFeatures.length} devices with both INDEX and ${kind.targetFeatureType} features`,
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
        // Call the per-window calculation function of this kind for each window.
        // Dispatched through `this` so instance-level overrides (tests) still apply.
        await this[kind.calculateFromIndexMethod](windowTime);
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
  calculateEnergyFromIndexFromBeginning,
};
