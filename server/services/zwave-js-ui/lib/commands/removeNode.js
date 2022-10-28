const logger = require('../../../../utils/logger');
const { DEFAULT } = require('../constants');

const REMOVE_NODE_TIMEOUT = 60 * 1000;

/**
 * @description Add node
 * @example
 * zwave.removeNode();
 */
function removeNode() {
  logger.debug(`Zwave : Entering exclusion mode`);

  this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startExclusion/set`);

  setTimeout(() => {
    this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/stopExclusion/set`);
    this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`, 'true');
    this.scanInProgress = true;
  }, REMOVE_NODE_TIMEOUT);
}

module.exports = {
  removeNode,
};
