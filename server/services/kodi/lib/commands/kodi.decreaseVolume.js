/**
 * @public
 * @description This function decrease the sond volume to the percent number in parameter.
 * @param {string} deviceId - The deviceId of Kodi to decrease volume.
 * @example
 * kodi.decreaseVolume('f07458cc-a9af-4cea-b706-760acfdba64c');
 * @returns {number} The volume value.
 */
function decreaseVolume(deviceId) {

  const connection = this.mapOfKodiConnection.get(deviceId);

  if( this.checkConnectionAndServerSate(connection, deviceId) && this.setVolume ){
    let volumeValue = connection.Application.SetVolume( { 'volume': 'decrement'} );
    volumeValue = connection.Application.SetVolume( { 'volume': 'decrement' } );
    return volumeValue;
  }

  return null;
}

module.exports = {
  decreaseVolume,
};
