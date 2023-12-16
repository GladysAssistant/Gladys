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
    await netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.GET_DEVICES_VALUES, message: null });

    let devicesNetatmo = [];
    try {
      devicesNetatmo = await netatmoHandler.loadDevices();
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
    await netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.CONNECTED, message: null });
  }, 120 * 1000);
}

/**
 *
 * @description Poll refreshing Token values of an Netatmo device.
 * @param {object} netatmoHandler - Of nothing.
 * @returns {Promise} Promise of nothing.
 * @example
 * pollRefreshingToken(netatmoHandler);
 */
async function pollRefreshingToken(netatmoHandler) {
  netatmoHandler.pollRefreshToken = setInterval(async () => {
    const { expireInToken } = netatmoHandler;
    logger.debug('Looking for Netatmo devices values...');

    const response = await netatmoHandler.refreshingTokens();
    if (response.success) {
      logger.info('Netatmo successfull refresh token');
      netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.CONNECTED, message: null });
    } else {
      logger.error('Netatmo no successfull refresh token and disconnect', response);
      const tokens = {
        accessToken: '',
        refreshToken: '',
        expireIn: '',
      };
      await netatmoHandler.setTokens(tokens);
      netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.ERROR.PROCESSING_TOKEN, message: null });
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
