// @ts-nocheck
/**
 * @public
 * @description This function mute kodi server
 * @param {string} deviceId - The deviceId of Kodi to mute.
 * @example
 * kodi.mute('f07458cc-a9af-4cea-b706-760acfdba64c');
 * @returns {boolean} The mute state.
 */
async function mute(deviceId) {

  const connection = this.mapOfKodiConnection.get(deviceId);

  if( this.checkConnectionAndServerSate(connection, deviceId) ){
    return connection.Application.SetMute(true);
  }
  return false;
}

module.exports = {
  mute,
};
