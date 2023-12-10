const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { CONFIGURATION_KEYS } = require('../utils/constants');

/**
 * @description Load eWeLink configuration.
 * @example
 * await this.loadConfiguration();
 */
async function loadConfiguration() {
  logger.info('eWeLink: loading stored configuration...');
  this.updateStatus({ configured: false, connected: false });

  try {
    const applicationId = await this.gladys.variable.getValue(CONFIGURATION_KEYS.APPLICATION_ID, this.serviceId);
    const applicationSecret = await this.gladys.variable.getValue(
      CONFIGURATION_KEYS.APPLICATION_SECRET,
      this.serviceId,
    );
    const applicationRegion = await this.gladys.variable.getValue(
      CONFIGURATION_KEYS.APPLICATION_REGION,
      this.serviceId,
    );

    if (!applicationId || !applicationSecret || !applicationRegion) {
      throw new ServiceNotConfiguredError('eWeLink configuration is not setup');
    }

    this.configuration = { applicationId, applicationSecret, applicationRegion };

    this.createClients();
  } catch (e) {
    this.updateStatus({ configured: false, connected: false });
    throw e;
  }

  try {
    // Load tokens from databate
    const tokens = await this.gladys.variable.getValue(CONFIGURATION_KEYS.USER_TOKENS, this.serviceId);
    if (!tokens) {
      throw new ServiceNotConfiguredError('eWeLink user is not connected');
    }

    const tokenObject = JSON.parse(tokens);
    this.ewelinkWebAPIClient.at = tokenObject.accessToken;
    this.ewelinkWebAPIClient.rt = tokenObject.refreshToken;

    logger.info('eWeLink: stored configuration well loaded...');
  } catch (e) {
    this.updateStatus({ configured: true, connected: false });
    throw e;
  }

  this.updateStatus({ configured: true, connected: true });
}

module.exports = {
  loadConfiguration,
};
