// @ts-nocheck
const logger = require('../../../../utils/logger');

/**
 * @private
 * @description This function return the first player id.
 * @param {string} deviceId - The deviceId of Kodi to ping.
 * @example
 * kodi.getFirstPlayerId('f07458cc-a9af-4cea-b706-760acfdba64c');
 * @returns {number} The first player id.
 */
async function getFirstPlayerId(deviceId) {

  const connection = this.mapOfKodiConnection.get(deviceId);

  if( this.checkConnectionAndServerSate(connection, deviceId) ){
    const tableElement = await connection.Player.GetActivePlayers();
    if( tableElement ){
      const firstElement = tableElement[0];
      if( firstElement && firstElement.playerid ){
        logger.debug(`Player.PlayPause : ${firstElement.playerid}`);
        return firstElement.playerid ;
      }
    }
  }
  return null;
}

module.exports = {
  getFirstPlayerId,
};
