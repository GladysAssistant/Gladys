const logger = require('../../../../utils/logger');
const { DEFAULT } = require('../constants');

const ADD_NODE_TIMEOUT = 60 * 1000;

/**
 * @description Add node
 * @param {boolean} secure - Secure node.
 * @example
 * zwave.addNode(true);
 */
function addNode(secure = true) {
  logger.debug(`Zwave : Entering inclusion mode`);

  this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startInclusion/set`);

  setTimeout(() => {
    this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/stopInclusion/set`);
    this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`, 'true');
    this.scanInProgress = true;
  }, ADD_NODE_TIMEOUT);
}

module.exports = {
  addNode,
};
