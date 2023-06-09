const logger = require('../../../../utils/logger');
const { DEFAULT } = require('../constants');

/**
 * @description Add node.
 * @param {boolean} secure - Secure node.
 * @example
 * zwave.addNode(true);
 */
function addNode(secure = true) {
  logger.debug(`Zwave : Entering inclusion mode`);

  this.mqttClient.publish(`${this.mqttTopicPrefix}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startInclusion/set`);

  setTimeout(() => {
    this.mqttClient.publish(`${this.mqttTopicPrefix}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/stopInclusion/set`);
    this.scanNetwork();
  }, DEFAULT.ADD_NODE_TIMEOUT);
}

module.exports = {
  addNode,
};
