const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { getDeviceFeature, getDeviceParam } = require('../../../utils/device');
const { getUsagePointIdFromExternalId } = require('../utils/parser');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../utils/constants');

const ENEDIS_SYNC_BATCH_SIZE = 100;
const LAST_DATE_SYNCED = 'LAST_DATE_SYNCED';

/**
 * @description Get one batch of enedis data, then call the next one.
 * @param {Object} gladys - Gladys object reference.
 * @param {string} externalId - Enedis usage point external id.
 * @param {number} syncDelayBetweenCallsInMs - Delay between calls in ms.
 * @param {string} after - Get data after this date.
 * @returns {Promise<string>} - Resolve with last date.
 * @example await recursiveBatchCall('usage-point');
 */
async function recursiveBatchCall(gladys, externalId, syncDelayBetweenCallsInMs, after = '2000-01-01') {
  const usagePointId = getUsagePointIdFromExternalId(externalId);
  logger.debug(`Enedis: Syncing ${usagePointId} after ${after}`);
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
 * @description Sync Enedis account
 * @returns {Promise} Resolving when finished.
 * @example
 * sync();
 */
async function sync() {
  logger.info('Enedis: Syncing account');
  const usagePoints = await this.gladys.device.get({
    service: 'enedis',
  });
  logger.info(`Enedis: Found ${usagePoints.length} usage points to sync`);
  // Foreach usage point
  await Promise.each(usagePoints, async (usagePoint) => {
    const usagePointFeature = getDeviceFeature(
      usagePoint,
      DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
    );

    let lastDateSynced = getDeviceParam(usagePoint, LAST_DATE_SYNCED);

    if (!lastDateSynced) {
      lastDateSynced = undefined;
    }

    if (!usagePointFeature) {
      return;
    }

    logger.info(`Enedis: Usage point last sync was ${lastDateSynced}`);

    // syncing all batches
    const lastDateSync = await recursiveBatchCall(
      this.gladys,
      usagePointFeature.external_id,
      this.syncDelayBetweenCallsInMs,
      lastDateSynced,
    );

    logger.info(`Enedis: Saving new last data sync = ${lastDateSync}`);

    // save last date synced in DB
    await this.gladys.device.setParam(usagePoint, LAST_DATE_SYNCED, lastDateSync);
  });
}

module.exports = {
  sync,
};
