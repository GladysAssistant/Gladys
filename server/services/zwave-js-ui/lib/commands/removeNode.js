const logger = require('../../../../utils/logger');
const { DEFAULT } = require('../constants');

/**
 * @description Add node.
 * @example
 * zwave.removeNode();
 */
function removeNode() {
  logger.debug(`Zwave : Entering exclusion mode`);

  this.mqttClient.publish(`${this.mqttTopicPrefix}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startExclusion/set`);

  setTimeout(() => {
    this.mqttClient.publish(`${this.mqttTopicPrefix}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/stopExclusion/set`);
    this.scanNetwork();
  }, DEFAULT.REMOVE_NODE_TIMEOUT);
}

module.exports = {
  removeNode,
};
