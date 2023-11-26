const crypto = require('crypto'); // Ajouter pour générer une chaîne 'state' unique

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

const { STATUS, SCOPES } = require('./utils/netatmo.constants');

/**
 * @description Connect to Netatmo cloud.
 * @param {object} configuration - Netatmo configuration properties.
 * @example
 * connect({baseUrl, clientId, clientSecret, scopes});
 */
async function connect(netatmoHandler, configuration) {
  const { baseUrl, clientId, clientSecret, scopes } = configuration;

  if (!baseUrl || !clientId || !clientSecret) {
    this.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }

  this.status = STATUS.CONNECTING;
  netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });

  logger.debug('Connecting to Netatmo...');

  this.state = crypto.randomBytes(16).toString('hex');
  const scopeValue = scopes && scopes.scopeEnergy ? scopes.scopeEnergy : SCOPES.ENERGY.read;
  try {
    this.redirectUri = `${baseUrl}/oauth2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopeValue)}&state=${this.state}`
    console.log(this.redirectUri)
    return { authUrl: this.redirectUri, state: this.state };
  } catch (e) {
    this.status = STATUS.ERROR;
    netatmoHandler.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: this.status },
    });
    logger.error('Error connecting to Netatmo - Details:', e.response ? e.response.data : e);
    throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
  }
}

module.exports = {
  connect,
};
