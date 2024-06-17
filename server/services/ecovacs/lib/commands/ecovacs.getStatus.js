const logger = require('../../../../utils/logger');

/**
 * @description Ecovacs status.
 * @returns {any} Null.
 * @example
 * ecovacs.getStatus();
 */
function getStatus() {
  logger.debug(`Ecovacs: service status`);
  const status = {
    connected: this.connected,
    configured: this.configured,
  };
  return status;
}

module.exports = {
  getStatus,
};
