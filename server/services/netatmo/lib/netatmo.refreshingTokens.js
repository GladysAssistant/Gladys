const { default: axios } = require('axios');
const querystring = require('querystring');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

const { STATUS } = require('./utils/netatmo.constants');

/**
 * @description Netatmo retrieve access and refresh token method.
 * @param {object} configuration - Netatmo configuration properties.
 * @param {string} refreshToken - Netatmo Refresh Token to refresh access tokens.
 * @returns {Promise} Netatmo access token success.
 * @example
 * await netatmo.refreshingTokens(
 *  netatmoHandler,
 *  {username, clientId, clientSecret, accessToken, refreshToken, scopes}
 * );
 */
async function refreshingTokens(configuration, refreshToken) {
    const { clientId, clientSecret } = configuration;

    if (!clientId || !clientSecret || !refreshToken) {
        this.status = STATUS.NOT_INITIALIZED;
        throw new ServiceNotConfiguredError('Netatmo is not connected.');
    }

    this.status = STATUS.PROCESSING_TOKEN;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
        payload: { status: this.status },
    });

    logger.debug('Loading Netatmo refreshing tokens...');

    const authentificationForm = {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
    };

    let newAccessToken;
    let newRefreshToken;
    try {
        const response = await axios({
            url: `${this.baseUrl}/oauth2/token`,
            method: 'post',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Host: 'api.netatmo.com' },
            data: querystring.stringify(authentificationForm),
        });
        const tokens = {
            ...response.data,
            connected: true,
        };
        await this.setTokens(tokens);
        newAccessToken = response.data.access_token;
        newRefreshToken = response.data.refresh_token;
        this.status = STATUS.CONNECTED;
        logger.debug('Netatmo new access tokens well loaded');
    } catch (e) {
        this.status = STATUS.ERROR;
        logger.error('Error getting new accessToken to Netatmo - Details:', e.response ? e.response.data : e);
        throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${e}`);
    }

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
        payload: { status: this.status },
    });

    if (newAccessToken && newRefreshToken) {
        return { success: true };
    }
    return { success: false };
}

module.exports = {
    refreshingTokens,
};
