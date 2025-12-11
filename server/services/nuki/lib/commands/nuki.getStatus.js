const logger = require('../../../../utils/logger');

/**
 * @description Return Nuki service status.
 * @returns {any} Null.
 * @example
 * nuki.getStatus();
 */
async function getStatus() {
  logger.debug(`Nuki: get service status`);
  const mqtt = this.gladys.service.getService('mqtt');
  const mqttConfigured = await mqtt.isUsed();
  const { apiKey } = await this.getConfiguration();
  const nukiWebConfigured = apiKey && true;
  logger.debug(`Nuki: get service status -> Web : ${nukiWebConfigured} - MQTT: ${mqttConfigured}`);
  return {
    mqttOk: mqttConfigured,
    webOk: nukiWebConfigured,
  };
}

module.exports = {
  getStatus,
};
