const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 *
 * @description Poll values of an ecovacs device.
 * @param {Object} device - The device to poll.
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
    let state;
    switch (feature.category) {
      case DEVICE_FEATURE_CATEGORIES.BATTERY: // Integer
        if (feature.type === DEVICE_FEATURE_TYPES.VACBOT.INTEGER) {
          setTimeout(() => {
            vacbot.run('GetBatteryState');
          }, 1000);
          logger.debug(`Ecovacs: feature state : ${state}`);
        }
        break;
      default:
        break;
    }
  });
}

module.exports = {
  poll,
};
