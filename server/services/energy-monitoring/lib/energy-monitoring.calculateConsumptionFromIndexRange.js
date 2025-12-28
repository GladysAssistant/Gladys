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
 * @description Calculate consumption from index for all 30-minute windows from a date range.
 * This function finds the oldest device state for energy index devices and processes all 30-minute windows.
 * @param {Date|string|null} startAt - Optional start date (YYYY-MM-DD or Date).
 * @param {Array<string>} featureSelectors - Optional whitelist of consumption feature selectors.
 * @param {Date|string|null} endAt - Optional end date (YYYY-MM-DD or Date).
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example <caption>Recalculate full history</caption>
 * calculateConsumptionFromIndexRange(null, [], null, '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateConsumptionFromIndexRange(startAt, featureSelectors, endAt, jobId) {
  const selectors = Array.isArray(featureSelectors)
    ? featureSelectors.filter((s) => typeof s === 'string' && s.length > 0)
    : [];
  const selectorSet = new Set(selectors);
  return queueWrapper(this.queue, async () => {
    const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
    logger.info(`Calculating consumption from index from beginning in timezone ${systemTimezone}`);
    const parseDateWithBoundary = (value, boundary) => {
      if (value instanceof Date) {
        return value;
      }
      if (typeof value !== 'string') {
        return null;
      }
      const suffix = boundary === 'end' ? '23:59:59' : '00:00:00';
      const parsed = dayjs.tz(`${value} ${suffix}`, systemTimezone);
      return parsed.isValid() ? parsed.toDate() : null;
    };
    const parsedStartAt = parseDateWithBoundary(startAt, 'start');
    const parsedEndAt = parseDateWithBoundary(endAt, 'end');
    const now = dayjs().tz(systemTimezone);
    const nowDate = now.toDate();
    const effectiveEndAt = parsedEndAt && parsedEndAt < nowDate ? parsedEndAt : nowDate;

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
      const indexById = new Map(indexFeatures.map((f) => [f.id, f]));

      const consumptionFeatures = energyDevice.features.filter((f) => {
        const isConsumption =
          f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
          f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION;
        if (!isConsumption) {
          return false;
        }
        if (selectorSet.size === 0) {
          return true;
        }
        const featureSelector = f.selector || f.external_id || f.id;
        return selectorSet.has(featureSelector);
      });

      const matchedPairs = consumptionFeatures
        .map((consumptionFeature) => ({
          consumptionFeature,
          indexFeature: indexById.get(consumptionFeature.energy_parent_id),
        }))
        .filter((pair) => !!pair.indexFeature);

      if (matchedPairs.length > 0) {
        const uniqueIndexFeatures = new Map();
        const uniqueConsumptionFeatures = new Map();
        matchedPairs.forEach((pair) => {
          uniqueIndexFeatures.set(pair.indexFeature.id, pair.indexFeature);
          uniqueConsumptionFeatures.set(pair.consumptionFeature.id, pair.consumptionFeature);
        });
        devicesWithBothFeatures.push({
          device: energyDevice,
          indexFeatures: Array.from(uniqueIndexFeatures.values()),
          consumptionFeatures: Array.from(uniqueConsumptionFeatures.values()),
        });
      }
    });

    const shouldRestoreLastProcessed = Boolean(parsedEndAt && parsedEndAt < nowDate);
    const originalLastProcessedByDeviceId = new Map();
    if (shouldRestoreLastProcessed) {
      devicesWithBothFeatures.forEach(({ device }) => {
        const lastProcessedParam = device.params.find((p) => p.name === ENERGY_INDEX_LAST_PROCESSED);
        if (lastProcessedParam && lastProcessedParam.value) {
          originalLastProcessedByDeviceId.set(device.id, lastProcessedParam.value);
        }
      });
    }

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

    if (oldestStateTime) {
      logger.info(`Oldest device state found at: ${oldestStateTime}`);
    } else {
      logger.info('No device states found, nothing to process');
    }

    let effectiveStartAt = parsedStartAt || oldestStateTime;
    if (effectiveStartAt && parsedStartAt && oldestStateTime && parsedStartAt < oldestStateTime) {
      effectiveStartAt = oldestStateTime;
    }

    if (!effectiveStartAt) {
      logger.info('No valid start date found, nothing to process');
      return null;
    }

    if (effectiveStartAt > effectiveEndAt) {
      logger.info('Start date is after end date, nothing to process');
      return null;
    }

    // Round the start time down to the nearest 30-minute mark
    const startTime = dayjs(effectiveStartAt).tz(systemTimezone);
    const roundedStartTime = startTime
      .minute(startTime.minute() < 30 ? 0 : 30)
      .second(0)
      .millisecond(0);

    // Round end time up to the next 30-minute mark
    const endTime = dayjs(effectiveEndAt).tz(systemTimezone);
    const currentMinute = endTime.minute();
    const roundedEndTime = endTime
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

    logger.info(
      `Generated ${windows.length} thirty-minute windows to process for ${devicesWithBothFeatures.length} devices`,
    );

    const deletionStartTime = roundedStartTime.toDate();
    const deletionEndTime = roundedEndTime.toDate();
    const consumptionFeaturesToReset = new Map();
    devicesWithBothFeatures.forEach((deviceWithBothFeatures) => {
      (deviceWithBothFeatures.consumptionFeatures || []).forEach((feature) => {
        if (!feature.selector) {
          return;
        }
        consumptionFeaturesToReset.set(feature.selector, feature);
      });
    });

    await Promise.each(Array.from(consumptionFeaturesToReset.values()), async (feature) => {
      const { selector } = feature;
      if (parsedEndAt) {
        await this.gladys.device.destroyStatesBetween(selector, deletionStartTime, deletionEndTime);
      } else {
        await this.gladys.device.destroyStatesFrom(selector, deletionStartTime);
      }
    });

    // Reset the last processed timestamp
    await Promise.each(devicesWithBothFeatures, async (deviceWithBothFeatures) => {
      logger.debug(`Destroying last index processed for ${deviceWithBothFeatures.device.id}`);
      await this.gladys.device.destroyParam(deviceWithBothFeatures.device, ENERGY_INDEX_LAST_PROCESSED);
    });

    // Process each window sequentially
    let processedWindows = 0;
    let successfulWindows = 0;
    let failedWindows = 0;

    try {
      await Promise.each(windows, async (windowTime) => {
        try {
          // Call the existing calculateConsumptionFromIndex function for each window
          // Avoid double progress updates: outer job manages progress, so inner call runs without jobId
          await this.calculateConsumptionFromIndex(windowTime, Array.from(selectorSet), null);
          successfulWindows += 1;

          // Update job progress
          processedWindows += 1;
          if (jobId) {
            const progressPercentage = Math.round((processedWindows / windows.length) * 100);
            const currentDate = dayjs(windowTime)
              .tz(systemTimezone)
              .format('YYYY-MM-DD');
            await this.gladys.job.updateProgress(jobId, progressPercentage, { current_date: currentDate });
          }

          logger.debug(`Processed window ${processedWindows}/${windows.length}: ${windowTime.toISOString()}`);
        } catch (error) {
          failedWindows += 1;
          logger.error(`Error processing window ${windowTime.toISOString()}:`, error);

          // Continue processing other windows even if one fails
          processedWindows += 1;
          if (jobId) {
            const progressPercentage = Math.round((processedWindows / windows.length) * 100);
            const currentDate = dayjs(windowTime)
              .tz(systemTimezone)
              .format('YYYY-MM-DD');
            await this.gladys.job.updateProgress(jobId, progressPercentage, { current_date: currentDate });
          }
        }
      });
    } finally {
      if (shouldRestoreLastProcessed) {
        await Promise.each(devicesWithBothFeatures, async ({ device }) => {
          const originalValue = originalLastProcessedByDeviceId.get(device.id);
          if (originalValue) {
            await this.gladys.device.setParam(device, ENERGY_INDEX_LAST_PROCESSED, originalValue);
          } else {
            await this.gladys.device.destroyParam(device, ENERGY_INDEX_LAST_PROCESSED);
          }
        });
      }
    }

    logger.info(
      `Finished processing all windows. Successful: ${successfulWindows}, Failed: ${failedWindows}, Total: ${windows.length}`,
    );

    if (jobId) {
      await this.gladys.job.updateProgress(jobId, 100, { current_date: null });
    }

    return null;
  });
}

module.exports = {
  calculateConsumptionFromIndexRange,
};
