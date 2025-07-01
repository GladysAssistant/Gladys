const logger = require('../../../../utils/logger');

/**
 * @description Return Nuki service status.
 * @returns {any} Null.
 * @example
 * nuki.getStatus();
 */
function getStatus() {
  logger.debug(`Nuki: status`);
  const mqttConfigured = true;
  const nukiWebConfigured = true;
  return {
    mqttOk: mqttConfigured,
    webOk: nukiWebConfigured,
  };
}

module.exports = {
  getStatus,
};
