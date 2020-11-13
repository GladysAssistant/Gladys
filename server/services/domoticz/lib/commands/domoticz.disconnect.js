const logger = require('../../../../utils/logger');

/**
 * @description Disconnect from a Domoticz server
 * @example
 * domoticz.disconnect();
 */
async function disconnect() {
  logger.debug(`Domoticz: disconnect`);
  this.connected = false;
}

module.exports = {
  disconnect,
};
