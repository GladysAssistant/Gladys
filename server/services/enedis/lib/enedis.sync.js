const Promise = require('bluebird');
const dayjs = require('dayjs');

const logger = require('../../../utils/logger');
const { getDeviceFeature, getDeviceParam } = require('../../../utils/device');
const { getUsagePointIdFromExternalId } = require('../utils/parser');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../utils/constants');

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
  logger.debug('Enedis: Syncing account');
  const usagePoints = await this.gladys.device.get({
    service: 'enedis',
  });
  logger.debug(`Enedis: Found ${usagePoints.length} usage points to sync`);

  const totalUsagePoints = usagePoints.length;

  // Foreach usage point
  return Promise.mapSeries(usagePoints, async (usagePoint, index) => {
    const response = {
      dailyConsumptionSync: null,
      consumptionLoadCurveSync: null,
    };

    // Calculate base progress for this usage point
    // Each usage point represents (100 / totalUsagePoints)% of progress
    // Within each usage point: daily consumption = 50%, load curve = 50%
    const usagePointBaseProgress = (index / totalUsagePoints) * 100;
    const usagePointProgressShare = 100 / totalUsagePoints;

    // First, sync daily consumption
    const usagePointFeatureDailyConsumption = getDeviceFeature(
      usagePoint,
      DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
    );

    if (usagePointFeatureDailyConsumption) {
      const lastDateSynced = getDeviceParam(usagePoint, LAST_DATE_SYNCED);
      let syncFromDate = lastDateSynced;

      // We take a 1 week margin in case some days were lost
      if (lastDateSynced && !fromStart) {
        syncFromDate = dayjs(lastDateSynced, 'YYYY-MM-DD')
          .subtract(7, 'days')
          .format('YYYY-MM-DD');
      } else {
        syncFromDate = undefined;
      }

      logger.debug(`Enedis: Usage point last sync was ${lastDateSynced}, syncing from ${syncFromDate}`);

      // syncing all batches
      const lastDateSync = await recursiveBatchCall(
        this.gladys,
        BATCH_TYPES.DAILY_CONSUMPTION,
        usagePointFeatureDailyConsumption.external_id,
        this.syncDelayBetweenCallsInMs,
        this.enedisSyncBatchSize,
        syncFromDate,
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

    // Update progress after daily consumption sync (50% of this usage point)
    if (jobId) {
      const progress = Math.round(usagePointBaseProgress + usagePointProgressShare * 0.5);
      await this.gladys.job.updateProgress(jobId, progress);
    }

    // Then, sync 30 minutes consumption
    const usagePointFeatureConsumptionLoadCurve = getDeviceFeature(
      usagePoint,
      DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    );

    if (usagePointFeatureConsumptionLoadCurve) {
      const lastDateSynced = getDeviceParam(usagePoint, LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE);
      let syncFromDate = lastDateSynced;

      // We take a 1 week margin in case some days were lost
      if (lastDateSynced && !fromStart) {
        syncFromDate = dayjs(lastDateSynced, 'YYYY-MM-DD')
          .subtract(7, 'days')
          .format('YYYY-MM-DD');
      } else {
        syncFromDate = undefined;
      }

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

    // Update progress after load curve sync (100% of this usage point)
    if (jobId) {
      const progress = Math.round(usagePointBaseProgress + usagePointProgressShare);
      await this.gladys.job.updateProgress(jobId, progress);
    }

    return response;
  });
}

module.exports = {
  sync,
};
