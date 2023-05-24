const logger = require('../../../utils/logger');

/**
 * @description Getting SunSpec status.
 * @returns {object} Return Object of status.
 * @example
 * sunspec.getStatus();
 */
function getStatus() {
  logger.debug(`SunSpec: Getting status...`);

  return {
    connected: this.connected,
  };
}

module.exports = {
  getStatus,
};
