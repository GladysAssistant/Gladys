const { STATUS } = require('./utils/netatmo.constants');
const logger = require('../../../utils/logger');
const { updateValues } = require('./netatmo.saveValue');

/**
 *
 * @description Poll values of Netatmo devices.
 * @param {object} netatmoHandler - Of nothing.
 * @example
 * refreshNetatmoValues(netatmoHandler);
 */
async function refreshNetatmoValues(netatmoHandler) {
  logger.debug('Looking for Netatmo devices values...');
  netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.GET_DEVICES_VALUES, message: null });

  let devicesNetatmo = [];
  try {
    devicesNetatmo = await netatmoHandler.loadDevices();
  } catch (e) {
    netatmoHandler.saveStatus(netatmoHandler, {
      statusType: STATUS.ERROR.GET_DEVICES_VALUES,
      message: 'get_devices_value_fail',
    });
    logger.error('Unable to load Netatmo devices', e);
  }
  devicesNetatmo.map(async (device) => {
    const externalId = `netatmo:${device.id}`;
    const deviceExistInGladys = await netatmoHandler.gladys.stateManager.get('deviceByExternalId', externalId);
    if (deviceExistInGladys) {
      await updateValues(netatmoHandler, deviceExistInGladys, device, externalId);
    } else {
      logger.info('device does not exist in Gladys');
    }
  });
  netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.CONNECTED, message: null });
}

/**
 *
 * @description Poll values of Netatmo devices.
 * @param {object} netatmoHandler - Of nothing.
 * @example
 * pollRefreshingValues(netatmoHandler);
 */
function pollRefreshingValues(netatmoHandler) {
  refreshNetatmoValues(netatmoHandler);

  netatmoHandler.pollRefreshValues = setInterval(() => refreshNetatmoValues(netatmoHandler), 120 * 1000);
}

/**
 *
 * @description Poll refreshing Token values of an Netatmo device.
 * @param {object} netatmoHandler - Of nothing.
 * @example
 * refreshNetatmoTokens(netatmoHandler);
 */
async function refreshNetatmoTokens(netatmoHandler) {
  const { expireInToken } = netatmoHandler;
  logger.debug('Looking for Netatmo devices values...');

  netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.PROCESSING_TOKEN, message: null });
  const response = await netatmoHandler.refreshingTokens();
  if (response.success) {
    logger.info('Netatmo successfull refresh token');
    await netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.CONNECTED, message: null });
  } else {
    logger.error('Netatmo no successfull refresh token and disconnect', response);
    const tokens = {
      accessToken: '',
      refreshToken: '',
      expireIn: '',
    };
    await netatmoHandler.saveStatus(netatmoHandler, { statusType: STATUS.ERROR.PROCESSING_TOKEN, message: null });
    await netatmoHandler.setTokens(netatmoHandler, tokens);
  }
  if (netatmoHandler.expireInToken !== expireInToken) {
    netatmoHandler.expireInToken = expireInToken;
    logger.warn(`New expiration access_token : ${netatmoHandler.expireInToken}ms `);
    clearInterval(netatmoHandler.pollRefreshToken);
    await netatmoHandler.pollRefreshingToken();
  }
}

/**
 *
 * @description Poll refreshing Token values of an Netatmo device.
 * @param {object} netatmoHandler - Of nothing.
 * @example
 * pollRefreshingToken(netatmoHandler);
 */
function pollRefreshingToken(netatmoHandler) {
  refreshNetatmoTokens(netatmoHandler);

  netatmoHandler.pollRefreshToken = setInterval(
    () => refreshNetatmoTokens(netatmoHandler),
    netatmoHandler.expireInToken * 1000,
  );
}

module.exports = {
  pollRefreshingValues,
  pollRefreshingToken,
};
