const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { CONFIGURATION_KEYS } = require('../utils/constants');

/**
 * @description Retrieve the user API key from eWeLink user family. It also store in database.
 * @example
 * await this.retrieveUserApiKey();
 */
async function retrieveUserApiKey() {
  logger.info('eWeLink: loading user API key...');

  // Load API key
  const { currentFamilyId, familyList } = await this.handleRequest(
    () => this.ewelinkWebAPIClient.home.getFamily(),
    true,
  );
  const { apikey: apiKey } = familyList.find((family) => family.id === currentFamilyId) || {};

  // Store API key
  if (apiKey) {
    logger.info('eWeLink: saving user API key...');
    this.userApiKey = apiKey;
    await this.gladys.variable.setValue(CONFIGURATION_KEYS.USER_API_KEY, apiKey, this.serviceId);
  } else {
    throw new ServiceNotConfiguredError('eWeLink: no user API key retrieved');
  }
}

module.exports = {
  retrieveUserApiKey,
};
