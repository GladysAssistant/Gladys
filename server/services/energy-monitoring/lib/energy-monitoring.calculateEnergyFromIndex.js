const Promise = require('bluebird');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = require('../../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { convertEnergyUnit } = require('../../../utils/units');

/**
 * @description Calculate a thirty-minute energy value (consumption or production, depending on
 * the kind) from index differences, for devices that have INDEX features with a corresponding
 * thirty-minutes feature (linked via energy_parent_id).
 * @param {object} kind - One of ENERGY_FROM_INDEX_KINDS (consumption or production).
 * @param {Date} thirtyMinutesWindowTime - The specific time for the thirty-minute window.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateEnergyFromIndex(ENERGY_FROM_INDEX_KINDS.CONSUMPTION, new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateEnergyFromIndex(kind, thirtyMinutesWindowTime, jobId) {
  const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  logger.info(
    `Calculating ${kind.name} from index in timezone ${systemTimezone} for window ${thirtyMinutesWindowTime}`,
  );

  // Get all devices that can carry this kind of index feature
  const energyDevices = await this.gladys.device.get({
    device_feature_categories: Object.keys(kind.indexFeatureTypes),
  });

  logger.info(`Found ${energyDevices.length} energy devices`);

  // Filter devices that have INDEX features with a corresponding thirty-minutes feature
  // The thirty-minutes feature should have energy_parent_id pointing to the index feature
  const devicesWithBothFeatures = [];

  energyDevices.forEach((energyDevice) => {
    // Find all INDEX features in this device
    const indexFeatures = energyDevice.features.filter(
      (f) => kind.indexFeatureTypes[f.category] && kind.indexFeatureTypes[f.category].includes(f.type),
    );

    // For each INDEX feature, find the corresponding thirty-minutes feature
    indexFeatures.forEach((indexFeature) => {
      const targetFeature = energyDevice.features.find(
        (f) =>
          f.category === kind.targetFeatureCategory &&
          f.type === kind.targetFeatureType &&
          f.energy_parent_id === indexFeature.id,
      );

      if (targetFeature) {
        devicesWithBothFeatures.push({
          device: energyDevice,
          indexFeature,
          targetFeature,
        });
      }
    });
  });

  // One device can carry several index features (e.g. a Linky meter exposing EASF01..EASF10),
  // so this counts index/target feature pairs, not distinct devices
  logger.info(`Found ${devicesWithBothFeatures.length} INDEX/${kind.targetFeatureType} feature pairs`);

  // Process each device
  await Promise.each(devicesWithBothFeatures, async (deviceInfo, index) => {
    try {
      const { device, indexFeature, targetFeature } = deviceInfo;

      // Calculate the 30-minute window boundaries
      const windowStart = dayjs(thirtyMinutesWindowTime)
        .subtract(30, 'minutes')
        .toDate();
      const windowEnd = dayjs(thirtyMinutesWindowTime).toDate();

      logger.debug(`Processing device ${device.name} for window ${windowStart} to ${windowEnd}`);

      // Get the last processed index timestamp from device parameters.
      // The cursor is scoped per index feature so a device with several
      // index/thirty-minutes pairs (e.g. a multi-string inverter) cannot
      // rewind or advance another pair's watermark. Devices that processed
      // indexes before the cursor became per-feature fall back to the
      // legacy device-level param.
      const lastProcessedParamName = `${kind.lastProcessedParamName}_${indexFeature.id}`;
      const lastProcessedParam =
        device.params.find((p) => p.name === lastProcessedParamName) ||
        device.params.find((p) => p.name === kind.lastProcessedParamName);
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

      // Calculate the total value from all consecutive index differences
      let totalValue = 0;
      let lastValidIndex = null;
      let newLastProcessedTimestamp = lastProcessedTimestamp;

      for (let i = 0; i < indexStates.length; i += 1) {
        const currentState = indexStates[i];
        const currentIndex = currentState.value;
        const currentTimestamp = new Date(currentState.created_at);

        if (lastValidIndex !== null) {
          const indexDelta = currentIndex - lastValidIndex;

          // Handle delta calculation and counter resets
          if (indexDelta >= 0) {
            const convertedDelta = convertEnergyUnit(indexDelta, indexFeature.unit, targetFeature.unit);
            totalValue += convertedDelta;
            logger.debug(
              `Device ${device.name}: +${convertedDelta} (${currentIndex} - ${lastValidIndex}) at ${currentTimestamp}`,
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
      await this.gladys.device.setParam(device, lastProcessedParamName, newLastProcessedTimestamp.toISOString());

      // Save the total value (always create historical state, even if 0)
      logger.debug(`Device ${device.name}: total ${kind.name} = ${totalValue}`);

      await this.gladys.device.saveHistoricalState(targetFeature, totalValue, thirtyMinutesWindowTime);

      logger.info(`Saved ${kind.name} ${totalValue} for device ${device.name} at ${thirtyMinutesWindowTime}`);
    } catch (error) {
      logger.error(`Error processing device ${deviceInfo.device.name}:`, error);
    }

    // Update job progress
    if (jobId) {
      await this.gladys.job.updateProgress(jobId, Math.round(((index + 1) / devicesWithBothFeatures.length) * 100));
    }
  });

  logger.info(`Finished calculating ${kind.name} from index for ${devicesWithBothFeatures.length} devices`);
  return null;
}

module.exports = {
  calculateEnergyFromIndex,
};
