const logger = require('../../../../utils/logger');

/**
 * @description Getting Z-Wave information.
 * @returns {Promise<Object>} Return Object of information.
 * @example
 * zwave.getConfiguration();
 */
async function getConfiguration() {
  logger.debug(`Zwave : Getting informations...`);

  return {
    externalZwaveJSUI: this.externalZwaveJSUI,
    mqttUrl: this.mqttUrl,
    mqttUsername: this.mqttUsername,
    mqttPassword: this.mqttPassword,
    driverPath: this.driverPath,
    s2UnauthenticatedKey: this.s2UnauthenticatedKey,
    s2AuthenticatedKey: this.s2AuthenticatedKey,
    s2AccessControlKey: this.s2AccessControlKey,
    s0LegacyKey: this.s0LegacyKey,
  };
}

module.exports = {
  getConfiguration,
};
