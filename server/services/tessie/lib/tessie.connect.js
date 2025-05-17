const crypto = require('crypto');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API } = require('./utils/tessie.constants');

/**
 * @description Connect to Tessie using API key.
 * @returns {Promise} Tessie connection status.
 * @example
 * connect();
 */
async function connect() {
  const { apiKey } = this.configuration;
  if (!apiKey) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not configured.');
  }
  await this.saveStatus({ statusType: STATUS.CONNECTING, message: null });
  logger.debug('Connecting to Tessie...');
  console.log('apiKey', apiKey);
  try {
    const response = await fetch(API.TOKEN, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Host: API.HEADER.HOST,
      },
      body: new URLSearchParams(authentificationForm).toString(),
    });
    const rawBody = await response.text();
    // Test de la connexion en récupérant la liste des véhicules
    const response = await this.gladys.httpClient.get(`${API.VEHICLES}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...API.HEADER
      }
    });

    if (response.status === 200) {
      await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
      this.configured = true;
      return { status: 'connected' };
    } else {
      throw new Error('Failed to connect to Tessie');
    }
  } catch (error) {
    await this.saveStatus({
      statusType: STATUS.ERROR.CONNECTING,
      message: error.message
    });
    throw error;
  }
}

module.exports = {
  connect,
};
