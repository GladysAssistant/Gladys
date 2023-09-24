const Promise = require('bluebird');
const dayjs = require('dayjs');

const logger = require('../../../utils/logger');
const { getDeviceFeature, getDeviceParam } = require('../../../utils/device');
const { getUsagePointIdFromExternalId } = require('../utils/parser');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../utils/constants');

const ENEDIS_SYNC_BATCH_SIZE = 100;
const LAST_DATE_SYNCED = 'LAST_DATE_SYNCED';

/**
 * @description Get one batch of enedis data, then call the next one.
 * @param {object} gladys - Gladys object reference.
 * @param {string} externalId - Enedis usage point external id.
 * @param {number} syncDelayBetweenCallsInMs - Delay between calls in ms.
 * @param {string} after - Get data after this date.
 * @returns {Promise<string>} - Resolve with last date.
 * @example await recursiveBatchCall('usage-point');
 */
async function recursiveBatchCall(gladys, externalId, syncDelayBetweenCallsInMs, after = '2000-01-01') {
  const usagePointId = getUsagePointIdFromExternalId(externalId);
  logger.info(`Enedis: Syncing ${usagePointId} after ${after}`);
  const data = await gladys.gateway.enedisGetDailyConsumption({
    usage_point_id: usagePointId,
    after,
    take: ENEDIS_SYNC_BATCH_SIZE,
  });

  // Foreach value returned in the interval, we save it slowly in DB
  await Promise.each(data, async (value) => {
    gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: externalId,
      state: value.value,
      created_at: new Date(value.created_at),
    });
    await Promise.delay(syncDelayBetweenCallsInMs / 10);
  });
  await Promise.delay(syncDelayBetweenCallsInMs);

  // If there was still some data to get
  if (data.length === ENEDIS_SYNC_BATCH_SIZE) {
    const lastEntry = data[data.length - 1];
    return recursiveBatchCall(gladys, externalId, syncDelayBetweenCallsInMs, lastEntry.created_at);
  }
  if (data.length === 0) {
    return after;
  }
  return data[data.length - 1].created_at;
}

/**
 * @description Sync Enedis account.
 * @param {boolean} fromStart - Sync from start.
 * @returns {Promise} Resolving when finished.
 * @example
 * sync();
 */
async function sync(fromStart = false) {
  logger.debug('Enedis: Syncing account');
  const usagePoints = await this.gladys.device.get({
    service: 'enedis',
  });
  logger.debug(`Enedis: Found ${usagePoints.length} usage points to sync`);
  // Foreach usage point
  return Promise.mapSeries(usagePoints, async (usagePoint) => {
    const usagePointFeature = getDeviceFeature(
      usagePoint,
      DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
    );

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

    if (!usagePointFeature) {
      return null;
    }

    logger.debug(`Enedis: Usage point last sync was ${lastDateSynced}, syncing from ${syncFromDate}`);

    // syncing all batches
    const lastDateSync = await recursiveBatchCall(
      this.gladys,
      usagePointFeature.external_id,
      this.syncDelayBetweenCallsInMs,
      syncFromDate,
    );

    logger.debug(`Enedis: Saving new last data sync = ${lastDateSync}`);

    // save last date synced in DB
    await this.gladys.device.setParam(usagePoint, LAST_DATE_SYNCED, lastDateSync);

    return {
      syncFromDate,
      lastDateSynced,
      lastDateSync,
      usagePointExternalId: usagePointFeature.external_id,
    };
  });
}

module.exports = {
  sync,
};
