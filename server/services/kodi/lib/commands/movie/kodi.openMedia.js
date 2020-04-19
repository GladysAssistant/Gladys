// @ts-nocheck
/**
 * @public
 * @description This function open media in parameter.
 * @param {string} deviceId - The deviceId of Kodi to open media.
 * @param {Object} mediaItem - Media to start (file path).
 * @example
 * kodi.openMedia(mediaItem);
 * @returns {string} The list of all movies.
 */
async function openMedia(deviceId, mediaItem) {

  const connection = this.mapOfKodiConnection.get(deviceId);

  if( this.checkConnectionAndServerSate(connection, deviceId) && mediaItem ){
    const movies = await connection.Player.Open({'item': {'file':mediaItem}});
    return movies;
  }
  return null;
}

module.exports = {
  openMedia,
};
