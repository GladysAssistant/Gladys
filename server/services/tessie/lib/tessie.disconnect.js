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
    // Arrêter le polling s'il est actif
    if (this.pollRefreshValues) {
      clearInterval(this.pollRefreshValues);
      this.pollRefreshValues = undefined;
      this.currentPollingInterval = null;
      logger.debug('Polling stopped');
    }

    // Déconnecter tous les WebSockets
    await this.disconnectAllWebSockets();

    // Supprimer l'API key
    await this.gladys.variable.destroy(this.serviceId, 'TESSIE_API_KEY');

    // Réinitialiser la configuration
    this.configuration = {
      apiKey: null,
      websocketEnabled: false,
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
