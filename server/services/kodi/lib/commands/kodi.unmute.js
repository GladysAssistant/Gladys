/**
 * @public
 * @description This function unmute kodi server
 * @param {string} deviceId - The deviceId of Kodi to unmute.
 * @example
 * kodi.unmute('f07458cc-a9af-4cea-b706-760acfdba64c');
 * @returns {boolean} The mute state.
 */
function unmute(deviceId) {

  const connection = this.mapOfKodiConnection.get(deviceId);

  if( this.checkConnectionAndServerSate(connection, deviceId) ){
    return connection.run('Application.SetMute', false);
  }
  return true;
}

module.exports = {
  unmute,
};
