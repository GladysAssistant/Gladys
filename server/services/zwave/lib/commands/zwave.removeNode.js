const logger = require('../../../../utils/logger');

/**
 * @description Add node
 * @example
 * zwave.removeNode();
 */
function removeNode() {
  logger.debug(`Zwave : Entering exclusion mode`);
  this.zwave.removeNode();
}

module.exports = {
  removeNode,
};
