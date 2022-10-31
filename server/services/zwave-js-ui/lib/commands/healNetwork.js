const logger = require('../../../../utils/logger');
const { DEFAULT } = require('../constants');

/**
 * @description Heal ZWave Network.
 * @example
 * zwave.healNetwork();
 */
function healNetwork() {
  logger.debug(`Zwave : Healing network`);

  this.scanInProgress = true;
  this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`, 'true');

}

module.exports = {
  healNetwork,
};
