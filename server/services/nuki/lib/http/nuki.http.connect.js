const Nuki = require('nuki-web-api');
const logger = require('../../../../utils/logger');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  logger.info(`Nuki : Test http connection to Nuki Web API`);
  const { apiKey } = await this.nukiHandler.getConfiguration();
  this.nukiApi = new Nuki(apiKey);
}

module.exports = {
  connect,
};
