const logger = require('../../../../utils/logger');
const { DEFAULT } = require('../constants');

/**
 * @description Scan ZWave Network.
 * @example
 * zwave.scanNetwork();
 */
function scanNetwork() {
  logger.debug(`Zwave : Scaning network`);

  this.scanInProgress = true;
  this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`, 'true');
}

module.exports = {
  scanNetwork,
};
