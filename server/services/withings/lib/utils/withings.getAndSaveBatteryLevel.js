const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const withingsBatUtils = require('./withings.buildBatteryLevelValues');

/**
 * @description Call Withings WS to get measures of feature and save it.
 *
 * @param {Object} featureBattery - Withings battery feature to poll.
 * @param {Object} withingsDeviceId - Withings device id type to poll.
 * @param {Object} userId - Current user id.
 * @example
 * getAndSaveBatteryLevel(feature, 1459, 'rezrz-uiop-mlljl-jklmj-ji34k')
 */
async function getAndSaveBatteryLevel(featureBattery, withingsDeviceId, userId) {
  const userResult = await this.getDevices(userId);

  // Update battery level
  if (userResult.data && userResult.data.body && userResult.data.body.devices) {
    await Promise.each(userResult.data.body.devices, async (element) => {
      logger.debug('withingsDeviceId: ', withingsDeviceId);
      logger.debug('featureBattery: ', featureBattery);

      if (element.deviceid === withingsDeviceId) {
        const currentDate = new Date();

        const batteryValues = withingsBatUtils.buildBatteryLevelValues(element.battery);
        const currentBatValue = batteryValues[0];
        const currentBatValueString = batteryValues[1];

        featureBattery.last_value_changed = currentDate;
        featureBattery.last_value = currentBatValue;
        featureBattery.last_value_string = currentBatValueString;

        await this.gladys.device.saveHistoricalState(featureBattery, currentBatValue, currentDate);
      }
    });
  }
}

module.exports = {
  getAndSaveBatteryLevel,
};
