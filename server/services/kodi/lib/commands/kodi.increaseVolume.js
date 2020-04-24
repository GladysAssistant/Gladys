/**
 * @public
 * @description This function increase the sond volume to the percent number in parameter.
 * @param {string} deviceId - The deviceId of Kodi to increase volume.
 * @example
 * kodi.increaseVolume('f07458cc-a9af-4cea-b706-760acfdba64c');
 * @returns {number} The volume value.
 */
function increaseVolume(deviceId) {
  const connection = this.mapOfKodiConnection.get(deviceId);

  if (this.checkConnectionAndServerSate(connection, deviceId) && this.setVolume) {
    let volumeValue = connection.Application.SetVolume({ volume: 'increment' });
    volumeValue = connection.Application.SetVolume({ volume: 'increment' });
    return volumeValue;
  }

  return null;
}
module.exports = {
  increaseVolume,
};
