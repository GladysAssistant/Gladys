const Promise = require('bluebird');
const dayjs = require('dayjs');

const logger = require('../../../utils/logger');
const { getDeviceFeature, getDeviceParam } = require('../../../utils/device');
const { getUsagePointIdFromExternalId } = require('../utils/parser');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../utils/constants');
const { queueWrapper } = require('../utils/queueWrapper');

const LAST_DATE_SYNCED = 'LAST_DATE_SYNCED';
const LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE = 'LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE';

const BATCH_TYPES = {
  CONSUMPTION_LOAD_CURVE: 'ConsumptionLoadCurve',
  DAILY_CONSUMPTION: 'DailyConsumption',
};

/**
 * @description Get one batch of enedis data, then call the next one.
 * @param {object} gladys - Gladys object reference.
 * @param {string} batchType - Batch type ConsumptionLoadCurve or DailyConsumption or DailyConsumptionMaxPower.
 * @param {string} externalId - Enedis usage point external id.
 * @param {number} syncDelayBetweenCallsInMs - Delay between calls in ms.
 * @param {number} enedisSyncBatchSize - Number of items to get in one call.
 * @param {string} after - Get data after this date.
 * @param {Function} onProgress - Callback function to report progress.
 * @returns {Promise<object>} - Resolve with last date.
 * @example await recursiveBatchCall('usage-point');
 */
async function recursiveBatchCall(
  gladys,
  batchType,
  externalId,
  syncDelayBetweenCallsInMs,
  enedisSyncBatchSize,
  after = '2000-01-01',
  onProgress = null,
) {
  const usagePointId = getUsagePointIdFromExternalId(externalId);
  logger.info(`Enedis: Syncing ${usagePointId} after ${after}`);
  const data = await gladys.gateway[`enedisGet${batchType}`]({
    usage_point_id: usagePointId,
    after,
    take: enedisSyncBatchSize,
  });

  // Foreach value returned in the interval, we save it slowly in DB
  await Promise.each(data, async (value) => {
    let valueToInsert = value.value;
    if (batchType === BATCH_TYPES.CONSUMPTION_LOAD_CURVE) {
      // Values are average power in W over a 30-minute interval.
      // Convert to energy in kWh: kWh = (W / 1000) * 0.5
      valueToInsert = (value.value / 1000) * 0.5;
    }
    gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: externalId,
      state: valueToInsert,
      created_at: new Date(value.created_at),
    });
    await Promise.delay(syncDelayBetweenCallsInMs / 10);
  });
  await Promise.delay(syncDelayBetweenCallsInMs);

  // Report progress after each batch
  if (onProgress) {
    await onProgress();
  }

  // If there was still some data to get
  if (data.length === enedisSyncBatchSize) {
    const lastEntry = data[data.length - 1];
    return recursiveBatchCall(
      gladys,
      batchType,
      externalId,
      syncDelayBetweenCallsInMs,
      enedisSyncBatchSize,
      lastEntry.created_at,
      onProgress,
    );
  }
  if (data.length === 0) {
    return after;
  }
  return data[data.length - 1].created_at;
}

/**
 * @description Sync Enedis account.
 * @param {boolean} fromStart - Sync from start.
 * @param {string} jobId - Job ID for progress tracking.
 * @returns {Promise} Resolving when finished.
 * @example
 * sync();
 */
async function sync(fromStart = false, jobId = null) {
  return queueWrapper(this.queue, async () => {
    logger.debug('Enedis: Syncing account');
    const usagePoints = await this.gladys.device.get({
      service: 'enedis',
    });
    logger.debug(`Enedis: Found ${usagePoints.length} usage points to sync`);

    // Constants for batch calculation
    // - DailyConsumption: 1 point per day, batch size = 1000 => ~1000 days per batch
    // - ConsumptionLoadCurve: 48 points per day, batch size = 1000 => ~21 days per batch
    const DAILY_POINTS_PER_DAY = 1;
    const LOAD_CURVE_POINTS_PER_DAY = 48;
    const MAX_HISTORY_DAYS = 1095; // ~3 years max from Enedis

    // Helper to calculate days to sync from a date
    const getDaysToSync = (syncFromDate) => {
      if (!syncFromDate) {
        return MAX_HISTORY_DAYS;
      }
      const daysFromDate = dayjs().diff(dayjs(syncFromDate, 'YYYY-MM-DD'), 'day');
      return Math.min(daysFromDate, MAX_HISTORY_DAYS);
    };

    // Helper to get syncFromDate for a usage point and param
    const getSyncFromDate = (usagePoint, paramName) => {
      const lastDateSynced = getDeviceParam(usagePoint, paramName);
      if (lastDateSynced && !fromStart) {
        return dayjs(lastDateSynced, 'YYYY-MM-DD')
          .subtract(7, 'days')
          .format('YYYY-MM-DD');
      }
      return undefined;
    };

    // First pass: calculate total estimated batches based on actual sync dates
    let totalEstimatedBatches = 0;

    usagePoints.forEach((usagePoint) => {
      // Check daily consumption feature
      const dailyFeature = getDeviceFeature(
        usagePoint,
        DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
      );
      if (dailyFeature) {
        const syncFromDate = getSyncFromDate(usagePoint, LAST_DATE_SYNCED);
        const daysToSync = getDaysToSync(syncFromDate);
        const batches = Math.max(1, Math.ceil((daysToSync * DAILY_POINTS_PER_DAY) / this.enedisSyncBatchSize));
        totalEstimatedBatches += batches;
      }

      // Check load curve feature
      const loadCurveFeature = getDeviceFeature(
        usagePoint,
        DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      );
      if (loadCurveFeature) {
        const syncFromDate = getSyncFromDate(usagePoint, LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE);
        const daysToSync = getDaysToSync(syncFromDate);
        const batches = Math.max(1, Math.ceil((daysToSync * LOAD_CURVE_POINTS_PER_DAY) / this.enedisSyncBatchSize));
        totalEstimatedBatches += batches;
      }
    });

    // Ensure we have at least 1 batch to avoid division by zero
    totalEstimatedBatches = Math.max(1, totalEstimatedBatches);

    // Progress increment per batch
    const progressPerBatch = 100 / totalEstimatedBatches;

    // Track overall progress across all batch calls
    let currentProgress = 0;

    // Helper to update progress
    const updateProgress = async (increment) => {
      if (jobId) {
        currentProgress = Math.min(100, currentProgress + increment);
        await this.gladys.job.updateProgress(jobId, Math.round(currentProgress));
      }
    };

    // Foreach usage point
    return Promise.mapSeries(usagePoints, async (usagePoint) => {
      const response = {
        dailyConsumptionSync: null,
        consumptionLoadCurveSync: null,
      };

      // First, sync daily consumption
      const usagePointFeatureDailyConsumption = getDeviceFeature(
        usagePoint,
        DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
      );

      if (usagePointFeatureDailyConsumption) {
        const lastDateSynced = getDeviceParam(usagePoint, LAST_DATE_SYNCED);
        const syncFromDate = getSyncFromDate(usagePoint, LAST_DATE_SYNCED);

        logger.debug(`Enedis: Usage point last sync was ${lastDateSynced}, syncing from ${syncFromDate}`);

        // syncing all batches
        const lastDateSync = await recursiveBatchCall(
          this.gladys,
          BATCH_TYPES.DAILY_CONSUMPTION,
          usagePointFeatureDailyConsumption.external_id,
          this.syncDelayBetweenCallsInMs,
          this.enedisSyncBatchSize,
          syncFromDate,
          () => updateProgress(progressPerBatch),
        );

        logger.debug(`Enedis: Saving new last data sync = ${lastDateSync}`);

        // save last date synced in DB
        await this.gladys.device.setParam(usagePoint, LAST_DATE_SYNCED, lastDateSync);

        response.dailyConsumptionSync = {
          syncFromDate,
          lastDateSynced,
          lastDateSync,
          usagePointExternalId: usagePointFeatureDailyConsumption.external_id,
        };
      }

      // Then, sync 30 minutes consumption
      const usagePointFeatureConsumptionLoadCurve = getDeviceFeature(
        usagePoint,
        DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      );

      if (usagePointFeatureConsumptionLoadCurve) {
        const lastDateSynced = getDeviceParam(usagePoint, LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE);
        const syncFromDate = getSyncFromDate(usagePoint, LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE);

        logger.debug(
          `Enedis: Usage point last consumption load curve sync was ${lastDateSynced}, syncing from ${syncFromDate}`,
        );

        // syncing all batches
        const lastDateSync = await recursiveBatchCall(
          this.gladys,
          BATCH_TYPES.CONSUMPTION_LOAD_CURVE,
          usagePointFeatureConsumptionLoadCurve.external_id,
          this.syncDelayBetweenCallsInMs,
          this.enedisSyncBatchSize,
          syncFromDate,
          () => updateProgress(progressPerBatch),
        );

        logger.debug(`Enedis: Saving new last data sync = ${lastDateSync}`);

        // save last date synced in DB
        await this.gladys.device.setParam(usagePoint, LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE, lastDateSync);

        response.consumptionLoadCurveSync = {
          syncFromDate,
          lastDateSynced,
          lastDateSync,
          usagePointExternalId: usagePointFeatureConsumptionLoadCurve.external_id,
        };
      }

      return response;
    });
  });
}

module.exports = {
  sync,
};
