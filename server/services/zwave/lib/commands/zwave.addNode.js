const logger = require('../../../../utils/logger');
const { DEFAULT } = require('../constants');

const ADD_NODE_TIMEOUT = 60 * 1000;

/**
 * @description Add node
 * @param {boolean} secure - Secure node.
 * @example
 * zwave.addNode(true);
 */
function addNode(secure = false) {
  logger.debug(`Zwave : Entering inclusion mode`);
  if (this.zwaveMode === DEFAULT.MODE_ZWAVEJS) {
    this.scanInProgress = true;
    this.driver.controller.beginInclusion(!secure);
    setTimeout(() => {
      this.driver.controller.stopInclusion();
      this.scanInProgress = false;
    }, ADD_NODE_TIMEOUT);
  } else {
    this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/api/startInclusion/set`, {});
    setTimeout(() => {
      this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/api/stopInclusion/set`);
      this.scanInProgress = false;
    }, ADD_NODE_TIMEOUT);
  }
}

module.exports = {
  addNode,
};
