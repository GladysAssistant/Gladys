const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 *
 * @description Poll values of an ecovacs device.
 * @param {object} device - The device to poll.
 * @returns {Promise} Promise of nothing.
 * @example
 * poll(device);
 */
async function poll(device) {
  if (!this.connected) {
    await this.connect();
  }
  let vacbot;
  this.vacbots.forEach((value, key) => {
    if (key.external_id === device.external_id) {
      vacbot = value;
    }
  });

  await Promise.mapSeries(device.features || [], (feature) => {
    logger.debug(`Ecovacs: feature: ${JSON.stringify(feature)}`);
    switch (feature.category) {
      case DEVICE_FEATURE_CATEGORIES.BATTERY: // Integer
        if (feature.type === DEVICE_FEATURE_TYPES.VACBOT.INTEGER) {
          vacbot.run('GetBatteryState');
        }
        break;
      default:
        break;
    }
  });
  // Retrieve states
  vacbot.run('GetCleanState'); // retrieve the cleaning status
  vacbot.run('GetChargeState'); // retrieve the charging status
  vacbot.run('GetSleepStatus');
  logger.trace(`POLL vacbot : `, vacbot);
  if (vacbot.errorCode !== 0) {
    logger.error(`Error ${vacbot.errorCode} occured : ${vacbot.errorDescription}.`);
  }
}

module.exports = {
  poll,
};
