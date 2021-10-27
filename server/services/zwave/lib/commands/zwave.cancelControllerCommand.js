const logger = require('../../../../utils/logger');

/**
 * @description Cancel
 * @example
 * zwave.cancelControllerCommand();
 */
function cancelControllerCommand() {
  logger.debug(`Zwave : Cancelling controller command`);
  this.zwave.cancelControllerCommand();
}

module.exports = {
  cancelControllerCommand,
};
