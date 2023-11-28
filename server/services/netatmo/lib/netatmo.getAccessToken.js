const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { GLADYS_VARIABLES, STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');

/**
 * @description Netatmo get access token.
 * @returns {Promise} Netatmo access token.
 * @example
 * await netatmo.getAccessToken();
 */
async function getAccessToken() {
  logger.debug('Loading Netatmo access token...');
  const accessToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_TOKEN, this.serviceId);

  if (!accessToken || accessToken === '') {
    const tokens = {
      access_token: '',
      refresh_token: '',
      expire_in: '',
      connected: false,
    };
    await this.setTokens(tokens);
    this.status = STATUS.DISCONNECTED;
    return undefined;
  }
  logger.debug(`Netatmo access token well loaded`);
  return accessToken;
}

module.exports = {
  getAccessToken,
};
