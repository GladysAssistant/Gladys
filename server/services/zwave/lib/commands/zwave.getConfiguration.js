const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { CONFIGURATION } = require('../constants');

/**
 * @description Getting Z-Wave information.
 * @returns {Object} Return Object of information.
 * @example
 * zwave.getConfiguration();
 */
async function getConfiguration() {
  logger.debug(`Zwave : Getting informations...`);

  return {
    homeId: this.driver?.ready ? this.driver?.controller?.homeId : 'Not ready',
    ownNodeId: this.driver?.ready ? this.driver?.controller?.ownNodeId : 'Not ready',
    type: this.driver?.ready ? this.driver?.controller?.type : 'Not ready',
    sdkVersion: this.driver?.ready ? this.driver?.controller?.sdkVersion : 'Not ready',

    zwaveMode: this.zwaveMode,
    zwaveDriverPath: this.zwaveDriverPath,
  };
}

module.exports = {
  getConfiguration,
};
