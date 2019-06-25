const logger = require('../../../../utils/logger');

/**
 * @description Add node
 * @param {boolean} secure - Secure node.
 * @example
 * zwave.addNode(true);
 */
function addNode(secure = false) {
  logger.debug(`Zwave : Entering inclusion mode`);
  this.zwave.addNode(secure);
}

module.exports = {
  addNode,
};
