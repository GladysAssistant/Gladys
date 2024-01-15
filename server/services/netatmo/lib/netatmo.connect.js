const crypto = require('crypto');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API } = require('./utils/netatmo.constants');

/**
 * @description Connect to Netatmo and getting code to get access tokens.
 * @returns {Promise} Netatmo access token.
 * @example
 * connect();
 */
async function connect() {
  const { clientId, clientSecret, scopes } = this.configuration;
  if (!clientId || !clientSecret) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  await this.saveStatus({ statusType: STATUS.CONNECTING, message: null });
  logger.debug('Connecting to Netatmo...');

  this.stateGetAccessToken = crypto.randomBytes(16).toString('hex');
  const scopeValues = Object.values(scopes).join(' ');
  this.redirectUri = `${API.OAUTH2}?client_id=${clientId}&scope=${encodeURIComponent(scopeValues)}&state=${
    this.stateGetAccessToken
  }`;
  this.configured = true;
  return { authUrl: this.redirectUri, state: this.stateGetAccessToken };
}

module.exports = {
  connect,
};
