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
  // this.driver.controller.beginInclusion(secure ?
  //   this.ZWaveJS.InclusionStrategy.Defalut : this.ZWaveJS.InclusionStrategy.Insecure);
  this.driver.controller.beginInclusion();
  setTimeout((() => {
    this.driver.controller.stopInclusion();
    this.scanInProgress = false;
  }), ADD_NODE_TIMEOUT);
}

module.exports = {
  addNode,
};
