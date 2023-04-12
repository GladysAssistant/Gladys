const logger = require('../../../../utils/logger');
const { DEFAULT } = require('../constants');

/**
 * @description Scan ZWave Network.
 * @example
 * zwave.scanNetwork();
 */
function scanNetwork() {
  logger.debug(`Zwave : Scaning network`);

  this.mqttClient.publish(`${this.mqttTopicPrefix}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`, 'true');
  this.scanInProgress = true;
}

module.exports = {
  scanNetwork,
};
