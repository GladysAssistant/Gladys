const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { STATUS } = require('./utils/netatmo.constants');

/**
 * @description Initialize service with properties and connect to devices.
 * @example
 * await init();
 */
async function init() {
  const configuration = await this.getConfiguration();
  const { username, clientId, clientSecret } = configuration;
  if (!username || !clientId || !clientSecret) {
    this.status = STATUS.NOT_INITIALIZED;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: this.status },
    });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
  this.configured = true;
  // TODO Limiter si redémarrages intempestifs ?
  const accessToken = await this.getAccessToken();
  if (accessToken) {
    const resRefreshToken = await this.getRefreshToken();

    if (resRefreshToken) {
      const { refreshToken } = resRefreshToken;
      const response = await this.refreshingTokens(configuration, refreshToken);
      if (response.success) {
        logger.info('Netatmo successfull connect');
        this.status = STATUS.CONNECTED;
      } else {
        logger.error('Netatmo no successfull connect', response);
        const tokens = {
          access_token: '',
          refresh_token: '',
          expire_in: '',
          connected: false,
        };
        await this.setTokens(tokens);
        this.status = STATUS.ERROR.PROCESSING_TOKEN;
      }
    } else {
      logger.debug('Netatmo no refresh token');
      this.status = STATUS.DISCONNECTED;
    }
  } else {
    logger.debug('Netatmo no access token');
    this.status = STATUS.DISCONNECTED;
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
    payload: { status: this.status },
  });
}

module.exports = {
  init,
};
