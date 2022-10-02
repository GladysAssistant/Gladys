const logger = require('../../../../utils/logger');
const Promise = require('bluebird');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');
const { parseExternalId } = require('../utils/ecovacs.externalId');

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
  const devices = await this.ecovacsClient.devices();
  const { deviceNumber } = parseExternalId(device.external_id);
  const vacuum = devices[deviceNumber];
  const vacbot = this.ecovacsClient.getVacBot(
                                      this.ecovacsClient.uid,
                                      this.ecovacsLibrary.EcoVacsAPI.REALM,
                                      this.ecovacsClient.resource,
                                      this.ecovacsClient.user_access_token,
                                      vacuum);
  await Promise.mapSeries(device.features || [], (feature) => {
    logger.debug(`Ecovacs: feature: ${JSON.stringify(feature)}`);
    let state;
    vacbot.connect();
    switch (feature.category) {
      case DEVICE_FEATURE_CATEGORIES.SWITCH: // Binary
        if (feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
          state = null;
          logger.debug(`Ecovacs: feature state : ${state}`);
        }
        break;
        case DEVICE_FEATURE_CATEGORIES.BATTERY: // Binary
          if (feature.type === DEVICE_FEATURE_TYPES.BATTERY.INTEGER) {
            setTimeout(() => {
              vacbot.run('GetBatteryState');
              vacbot.on('BatteryInfo', eventFunctionWrapper(this.onMessage.bind(this)));
            }, 6000);
            logger.debug(`Ecovacs: feature state : ${state}`);
          }
          break;
      default:
        break;
    }
    vacbot.disconnect();
  });

}

module.exports = {
  poll,
};
