const Nuki = require('nuki-web-api');
const logger = require('../../../../utils/logger');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  logger.info(`Nuki : Test http connection to Nuki Web API`);
  const { webOk } = await this.nukiHandler.getStatus();
  if (webOk) {
    const { apiKey } = await this.nukiHandler.getConfiguration();
    try {
      this.nukiApi = new Nuki(apiKey);
      await this.nukiApi.getSmartlocks();
    } catch (error) {
      logger.error(`Nuki : Unable to connect to Nuki Web API`, error);
    }
    logger.info(`Nuki : Connected to Nuki Web API`);
  }
}

module.exports = {
  connect,
};
