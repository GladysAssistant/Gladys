// @ts-nocheck

/**
 * @public
 * @description This function stop current media running in kodi server
 * @param {string} deviceId - The deviceId of Kodi to stop player.
 * @example
 * kodi.stopPlayer('f07458cc-a9af-4cea-b706-760acfdba64c');
 * @returns {string} The player state.
 */
async function stopPlayer(deviceId) {

  const connection = this.mapOfKodiConnection.get(deviceId);

  if( this.checkConnectionAndServerSate(connection, deviceId) ){
    const firstPlayerId = await this.getFirstPlayerId(deviceId);
    if( firstPlayerId ){
      return connection.run('Player.Stop', firstPlayerId);
    }
  }
  return null;
}

module.exports = {
  stopPlayer,
};
