const Promise = require('bluebird');
const dayjs = require('dayjs');
const get = require('get-value');
const logger = require('../../../utils/logger');
const { getDeviceFeature } = require('../../../utils/device');
const { getUsagePointIdFromExternalId } = require('../utils/parser');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../utils/constants');

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
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
    );

    if (!usagePointFeature) {
      return;
    }

    // Get the previous sync or start 2 years ago (max amount of data allowed by Enedis)
    const lastSync = usagePointFeature.last_value_changed
      ? dayjs(usagePointFeature.last_value_changed)
      : dayjs().subtract(2, 'years');

    let currendEndDate = dayjs();
    const syncTasksArray = [];

    console.log({ lastSync });

    while (currendEndDate > lastSync) {
      let startDate = currendEndDate.subtract(7, 'days');
      if (startDate < lastSync) {
        startDate = lastSync;
      }
      syncTasksArray.push({
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: currendEndDate.format('YYYY-MM-DD'),
      });
      currendEndDate = startDate;
    }

    // Foreach interval
    await Promise.each(syncTasksArray, async (syncTask) => {
      try {
        const data = await this.gladys.gateway.enedisGetConsumptionLoadCurve({
          usage_point_id: getUsagePointIdFromExternalId(usagePoint.external_id),
          start: syncTask.start_date,
          end: syncTask.end_date,
        });
        const values = data.meter_reading.interval_reading;

        // Foreach value returned in the interval
        await Promise.each(values, async (value) => {
          if (dayjs(value.date) > lastSync) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: usagePointFeature.external_id,
              state: value.value,
              created_at: new Date(value.date),
            });
          }
        });
        await Promise.delay(500);
      } catch (e) {
        const status = get(e, 'response.status');
        logger.warn(`Enedis: ${syncTask.start_date} - ${syncTask.end_date} : Error ${status}`);
      }
    });
  });
}

module.exports = {
  sync,
};
