const { default: axios } = require('axios');
const querystring = require('querystring');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS } = require('./utils/netatmo.constants');

/**
 * @description Netatmo retrieve access and refresh token method.
 * @param {object} configuration - Netatmo configuration properties.
 * @param {string} refreshToken - Netatmo Refresh Token to refresh access tokens.
 * @returns {Promise} Netatmo access token success.
 * @example
 * await netatmo.refreshingTokens(
 *  netatmoHandler,
 *  {clientId, clientSecret},
 *  refreshToken
 * );
 */
async function refreshingTokens(configuration, refreshToken) {
    const { clientId, clientSecret } = configuration;
    if (!clientId || !clientSecret || !refreshToken) {
        await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null })
        throw new ServiceNotConfiguredError('Netatmo is not connected.');
    }
    await this.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null })
    logger.debug('Loading Netatmo refreshing tokens...');
    const authentificationForm = {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
    };
    try {
        const response = await axios({
            url: `${this.baseUrl}/oauth2/token`,
            method: 'post',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Host: 'api.netatmo.com' },
            data: querystring.stringify(authentificationForm),
        });
        const tokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expire_in: response.data.expire_in,
            connected: true,
        };
        await this.setTokens(tokens);
        await this.saveStatus({ statusType: STATUS.CONNECTED })
        logger.debug('Netatmo new access tokens well loaded');
        return { success: true };
    } catch (e) {
        this.saveStatus({ statusType: STATUS.ERROR.PROCESSING_TOKEN, message: 'refresh_token_fail' })
        logger.error('Error getting new accessToken to Netatmo - Details:', e.response ? e.response.data : e);
        throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
    }
}

module.exports = {
    refreshingTokens,
};
