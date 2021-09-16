const logger = require('../../../../utils/logger');

const ADD_NODE_TIMEOUT = 60 * 1000;

/**
 * @description Add node
 * @param {boolean} secure - Secure node.
 * @example
 * zwave.addNode(true);
 */
function addNode(secure = false) {
  logger.debug(`Zwave : Entering inclusion mode`);
  this.driver.controller.beginInclusion();
  // this.driver.controller.beginInclusion(secure ?
  //  ZWaveJS.InclusionStrategy.Defalut : ZWaveJS.InclusionStrategy.Insecure);
  setTimeout((() => {
    this.driver.controller.stopInclusion();
    this.scanInProgress = false;
  }), ADD_NODE_TIMEOUT);
}

module.exports = {
  addNode,
};
