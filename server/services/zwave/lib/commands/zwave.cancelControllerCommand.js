const logger = require('../../../../utils/logger');

/**
 * @description Cancel current controller command
 * @example
 * zwave.cancelControllerCommand();
 */
function cancelControllerCommand() {
  if (this.scanInProgress) {
    this.driver.controller.stopInclusion();
    this.scanInProgress = false;
  } else {
    logger.warn(`Unable to cancel controller: unsupported command`);
  }
}

module.exports = {
  cancelControllerCommand,
};
