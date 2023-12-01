const { BadParameters } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { CONFIGURATION_KEYS } = require('../utils/constants');

/**
 * @description Save eWeLink application configuration.
 * @param {object} configuration - EWeLink application configuration.
 * @param {string} [configuration.applicationId] - Application ID.
 * @param {string} [configuration.applicationSecret] - Application secret.
 * @param {string} [configuration.applicationRegion] - Application region.
 * @example
 * await this.saveConfiguration(configuration);
 */
async function saveConfiguration({ applicationId = '', applicationSecret = '', applicationRegion = '' }) {
  logger.info('eWeLink: saving new configuration...');

  if (applicationId === '' || applicationSecret === '' || applicationRegion === '') {
    throw new BadParameters('eWeLink: all application ID/Secret/Region are required');
  }

  this.updateStatus({ configured: false, connected: false });

  try {
    await this.gladys.variable.setValue(CONFIGURATION_KEYS.APPLICATION_ID, applicationId, this.serviceId);
    await this.gladys.variable.setValue(CONFIGURATION_KEYS.APPLICATION_SECRET, applicationSecret, this.serviceId);
    await this.gladys.variable.setValue(CONFIGURATION_KEYS.APPLICATION_REGION, applicationRegion, this.serviceId);
    await this.gladys.variable.destroy(CONFIGURATION_KEYS.USER_TOKENS, this.serviceId);

    this.configuration = { applicationId, applicationSecret, applicationRegion };

    this.createClient();

    this.updateStatus({ configured: true, connected: false });
    logger.info('eWeLink: new configuration well saved...');
  } catch (e) {
    this.updateStatus({ configured: false, connected: false });
    throw e;
  }
}

module.exports = {
  saveConfiguration,
};
