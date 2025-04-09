const logger = require('../../../../utils/logger');
const { BadParameters } = require('../../../../utils/coreErrors');
const Nuki = require('nuki-web-api');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  logger.info(`Nuki : Test http connection to Nuki Web API`);
  const { apiKey } = await this.nukiHandler.getConfiguration();
  this.nukiApi = new Nuki(apiKey);
  if (!this.nukiApi) {
    throw new BadParameters(`Nuki web: API key not valid`);
  }
}

module.exports = {
  connect,
};
