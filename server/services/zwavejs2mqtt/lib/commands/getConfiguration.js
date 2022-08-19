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
    homeId: this.driver && this.driver.ready && this.driver.controller ? this.driver.controller.homeId : 'Not ready',
    ownNodeId:
      this.driver && this.driver.ready && this.driver.controller ? this.driver.controller.ownNodeId : 'Not ready',
    type: this.driver && this.driver.ready && this.driver.controller ? this.driver.controller.type : 'Not ready',
    sdkVersion:
      this.driver && this.driver.ready && this.driver.controller ? this.driver.controller.sdkVersion : 'Not ready',

    externalZwave2Mqtt: this.externalZwave2Mqtt,
    zwaveDriverPath: this.zwaveDriverPath,
  };
}

module.exports = {
  getConfiguration,
};
