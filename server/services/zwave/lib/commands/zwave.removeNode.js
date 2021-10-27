const logger = require('../../../../utils/logger');

const REMOVE_NODE_TIMEOUT = 60 * 1000;

/**
 * @description Add node
 * @example
 * zwave.removeNode();
 */
function removeNode() {
  logger.debug(`Zwave : Entering exclusion mode`);
  this.zwave.removeNode();
  setTimeout(this.cancelControllerCommand.bind(this), REMOVE_NODE_TIMEOUT);
}

module.exports = {
  removeNode,
};
