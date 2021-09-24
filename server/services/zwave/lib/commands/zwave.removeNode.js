const logger = require('../../../../utils/logger');

const REMOVE_NODE_TIMEOUT = 60 * 1000;

/**
 * @description Add node
 * @example
 * zwave.removeNode();
 */
function removeNode() {
  logger.debug(`Zwave : Entering exclusion mode`);
  this.driver.controller.beginExclusion();
  setTimeout(this.driver.controller.stopExclusion, REMOVE_NODE_TIMEOUT);
}

module.exports = {
  removeNode,
};
