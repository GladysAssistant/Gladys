// @ts-nocheck
const logger = require('../../../../utils/logger');

// Value of OK ping return server state
const kodiOkPingServerState = 'pong';

/**
 * @public
 * @description This function return true if kodi connection is not null and ping response is OK.
 * @param {Object} connection - The connection connection to check.
 * @param {string} deviceId - The device_id to check.
 * @example
 * kodi.checkConnectionAndServerSate(connection, deviceId);
 * @returns {boolean} True if kodi connection is not null and ping response is OK.
 */
async function checkConnectionAndServerSate(connection, deviceId) {
  // TODO : return exception to stop treatment and display generic error mesg or restart service !?

  if ( !this.checkConnection(connection) ){
    logger.warn('kodiConnection object is not alive !!!');
    return false;
  }

  const kodiPingValue = await this.pingKodi(deviceId);
  if( kodiPingValue!== kodiOkPingServerState ){
    logger.warn(`pingKodi return KO value (${kodiPingValue}) => Kodi server is down !!!`);
    return false;
  }

  return true;
}

module.exports = {
  checkConnectionAndServerSate,
};
