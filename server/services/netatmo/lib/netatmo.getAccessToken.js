const { GLADYS_VARIABLES, STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Netatmo get access token.
 * @returns {Promise} Netatmo access token.
 * @example
 * await netatmo.getAccessToken();
 */
async function getAccessToken() {
  logger.debug('Loading Netatmo access token...');
  const { serviceId } = this;
  try {
    this.accessToken = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_TOKEN, serviceId);
    if (!this.accessToken || this.accessToken === '') {
      const tokens = {
        accessToken: '',
        refreshToken: '',
        expireIn: '',
      };
      await this.setTokens(tokens);
      await this.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });
      return undefined;
    }
    logger.debug(`Netatmo access token well loaded`);
    return this.accessToken;
  } catch (e) {
    this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Netatmo is not configured.');
  }
}

module.exports = {
  getAccessToken,
};
