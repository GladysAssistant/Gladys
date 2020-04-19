/**
 * @public
 * @description This function set the sond volume to the percent number in parameter.
 * @param {string} deviceId - The deviceId of Kodi to set volume.
 * @param {number} percentVolume - The percent volume.
 * @example
 * kodi.setVolume('f07458cc-a9af-4cea-b706-760acfdba64c', percentVolume);
 * @returns {number} The volume value.
 */
function setVolume(deviceId, percentVolume) {

  const connection = this.mapOfKodiConnection.get(deviceId);

  if( this.checkConnectionAndServerSate(connection, deviceId) && percentVolume ){
    const volumeValue = connection.Application.SetVolume({'volume': percentVolume});
    return volumeValue;
  }

  return null;
}

module.exports = {
  setVolume,
};
