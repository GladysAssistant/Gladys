const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/tessie.constants');
const { getConfiguration } = require('./tessie.getConfiguration');

/**
 * @description Initialize Tessie service.
 * @returns {Promise} The result of the initialization.
 * @example
 * await init();
 */
async function init() {
  logger.debug('Initializing Tessie service...');
  await this.saveStatus({ statusType: STATUS.INITIALIZING, message: null });

  try {
    // Récupérer la configuration
    const configuration = await getConfiguration.call(this);

    if (!configuration.apiKey) {
      await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
      return false;
    }

    // Sauvegarder la configuration
    this.configuration = configuration;

    await this.saveStatus({ statusType: STATUS.INITIALIZED, message: null });
    logger.debug('Tessie service initialized successfully');
    return true;
  } catch (e) {
    logger.error('Error initializing Tessie service:', e);
    await this.saveStatus({ statusType: STATUS.ERROR.INITIALIZING, message: e.message });
    throw e;
  }
}

module.exports = {
  init,
};
