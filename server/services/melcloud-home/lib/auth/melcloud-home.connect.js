const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');

const { STATUS } = require('../utils/melcloud-home.constants');
const oauth = require('./melcloud-home.oauth');

/**
 * @description Connect to MELCloud Home using OAuth (refresh token if available, credentials otherwise).
 * @param {object} configuration - MELCloud Home configuration properties.
 * @example
 * connect({ username, password, refreshToken });
 */
async function connect(configuration) {
  const { username, password, refreshToken } = configuration;

  if (!refreshToken && (!username || !password)) {
    this.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('MELCloud Home is not configured.');
  }

  this.status = STATUS.CONNECTING;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD_HOME.STATUS,
    payload: { status: STATUS.CONNECTING },
  });

  logger.debug('Connecting to MELCloud Home...');

  try {
    let tokens;
    if (refreshToken) {
      // Reuse the stored refresh token to avoid a full login on each restart.
      this.refreshToken = refreshToken;
      tokens = await oauth.refresh(refreshToken);
    } else {
      tokens = await oauth.login(username, password);
    }
    await this.storeTokens(tokens);
    this.status = STATUS.CONNECTED;
    logger.debug('Connected to MELCloud Home');
  } catch (e) {
    // If the refresh token is no longer valid, fall back to a credentials login.
    if (refreshToken && username && password) {
      try {
        const tokens = await oauth.login(username, password);
        await this.storeTokens(tokens);
        this.status = STATUS.CONNECTED;
        logger.debug('Connected to MELCloud Home (after refresh token expired)');
      } catch (loginError) {
        this.status = STATUS.ERROR;
        logger.error('Error connecting to MELCloud Home:', loginError);
      }
    } else {
      this.status = STATUS.ERROR;
      logger.error('Error connecting to MELCloud Home:', e);
    }
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD_HOME.STATUS,
    payload: { status: this.status },
  });
}

module.exports = {
  connect,
};
