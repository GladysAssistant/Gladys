const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/tessie.constants');

/**
 * @description Disconnect from Tessie.
 * @returns {Promise} The result of the disconnection.
 * @example
 * await disconnect();
 */
async function disconnect() {
  logger.debug('Disconnecting from Tessie...');
  await this.saveStatus({ statusType: STATUS.DISCONNECTING, message: null });

  try {
    // Supprimer l'API key
    await this.gladys.variable.destroy(this.serviceId, 'TESSIE_API_KEY');

    // Réinitialiser la configuration
    this.configuration = {
      apiKey: null,
    };

    await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
    logger.debug('Disconnected from Tessie successfully');
    return true;
  } catch (e) {
    logger.error('Error disconnecting from Tessie:', e);
    await this.saveStatus({ statusType: STATUS.ERROR.DISCONNECTING, message: e.message });
    throw e;
  }
}

module.exports = {
  disconnect,
};
