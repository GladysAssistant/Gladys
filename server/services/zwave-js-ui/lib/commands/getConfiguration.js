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
    homeId: this.controller && this.controller.ready ? this.controller.homeId : 'Not ready',
    ownNodeId: this.controller && this.controller.ready ? this.controller.ownNodeId : 'Not ready',
    type: this.controller && this.controller.ready ? this.controller.type : 'Not ready',
    sdkVersion: this.controller && this.controller.ready ? this.controller.sdkVersion : 'Not ready',

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
