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
  this.zwave.addNode(secure);
  setTimeout(this.cancelControllerCommand.bind(this), ADD_NODE_TIMEOUT);
}

module.exports = {
  addNode,
};
