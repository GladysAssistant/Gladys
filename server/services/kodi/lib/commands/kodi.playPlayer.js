// @ts-nocheck
/**
 * @public
 * @description This function play/pause current media running in kodi server
 * @param {string} deviceId - The deviceId of Kodi to play/pause .
 * @example
 * kodi.playPlayer('f07458cc-a9af-4cea-b706-760acfdba64c');
 * @returns {string} The player state.
 */
async function playPlayer(deviceId) {
  const connection = this.mapOfKodiConnection.get(deviceId);

  if (this.checkConnectionAndServerSate(connection, deviceId)) {
    const firstPlayerId = await this.getFirstPlayerId(deviceId);
    if (firstPlayerId) {
      return connection.Player.PlayPause(firstPlayerId);
    }
  }
  return null;
}

module.exports = {
  playPlayer,
};
