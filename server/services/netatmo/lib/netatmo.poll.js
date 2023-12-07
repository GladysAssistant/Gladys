const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');
const { updateValues } = require('./netatmo.saveValue');

/**
 *
 * @description Poll values of Netatmo devices.
 * @param {object} netatmoHandler - Of nothing.
 * @returns {Promise} Promise of nothing.
 * @example
 * pollRefreshingValues(netatmoHandler);
 */
async function pollRefreshingValues(netatmoHandler) {
  netatmoHandler.pollRefreshValues = setInterval(async () => {
    logger.debug('Looking for Netatmo devices values...');
    if (netatmoHandler.status !== STATUS.CONNECTED) {
      clearInterval(netatmoHandler.pollRefreshValues);
      throw new ServiceNotConfiguredError('Unable to get Netatmo devices values until service is not well configured');
    }
    await netatmoHandler.saveStatus({ statusType: STATUS.GET_DEVICES_VALUES, message: null });

    let devicesNetatmo = [];
    try {
      devicesNetatmo = await netatmoHandler.loadDevices();
      logger.info(`${devicesNetatmo.length} getting Netatmo devices`);
    } catch (e) {
      logger.error('Unable to load Netatmo devices', e);
    }

    devicesNetatmo.map(async (device) => {
      const externalId = `netatmo:${device.id}`;
      const deviceExistInGladys = await netatmoHandler.gladys.stateManager.get('deviceByExternalId', externalId);
      if (deviceExistInGladys) {
        await updateValues(netatmoHandler, deviceExistInGladys, device, externalId);
      }
    });
    await netatmoHandler.saveStatus({ statusType: STATUS.CONNECTED, message: null });
  }, 20 * 1000);
}

/**
 *
 * @description Poll refreshing Token values of an Netatmo device.
 * @param {object} netatmoHandler - Of nothing.
 * @returns {Promise} Promise of nothing.
 * @example
 * pollRefreshingToken(device);
 */
async function pollRefreshingToken(netatmoHandler) {
  netatmoHandler.pollRefreshToken = setInterval(async () => {
    const {expireInToken} = netatmoHandler;
    logger.debug('Looking for Netatmo devices values...');

    const response = await netatmoHandler.refreshingTokens();
    if (response.success) {
      logger.info('Netatmo successfull refresh token');
      netatmoHandler.status = STATUS.CONNECTED;
      netatmoHandler.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    } else {
      logger.error('Netatmo no successfull refresh token and disconnect', response);
      const tokens = {
        accessToken: '',
        refreshToken: '',
        expireIn: '',
        connected: false,
      };
      await netatmoHandler.setTokens(tokens);
      netatmoHandler.status = STATUS.ERROR.PROCESSING_TOKEN;
      netatmoHandler.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: null });
    }
    if (netatmoHandler.expireInToken !== expireInToken) {
      netatmoHandler.expireInToken = expireInToken;
      logger.warn(`New expiration access_token : ${netatmoHandler.expireInToken}ms `);
      clearInterval(netatmoHandler.pollRefreshToken);
      await netatmoHandler.pollRefreshingToken();
    }
  }, netatmoHandler.expireInToken * 1000);
}

module.exports = {
  pollRefreshingValues,
  pollRefreshingToken,
};
