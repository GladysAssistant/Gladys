// @ts-nocheck
const logger = require('../../../../utils/logger');

/**
 * @public
 * @description This function ping kodi server and return state.
 * @param {string} deviceId - The deviceId of Kodi to ping.
 * @example
 * kodi.pingKodi('f07458cc-a9af-4cea-b706-760acfdba64c');
 * @returns {string} The server status.
 */
async function pingKodi(deviceId) {

  const connection = this.mapOfKodiConnection.get(deviceId);

  logger.debug(`Try to ping Kodi with deviceId : ${deviceId} (connection : ${connection} )`);

  if( this.checkConnection(connection) ){
    const kodiPingValue = await connection.JSONRPC.Ping();
    logger.debug(`kodiPingValue : ${kodiPingValue}`);
    return kodiPingValue;
  }
  return null;
}

module.exports = {
  pingKodi,
};
