/**
 * @public
 * @description Get playlist
 * @param {string} deviceSelector - The selector of the device to control.
 * @returns {Promise} Resolve with array of playlist.
 * @example
 * const playlists = await gladys.music.getPlaylist('sonos-living-room');
 */
async function getPlaylist(deviceSelector) {
  return this.callService('getPlaylist', deviceSelector, []);
}

module.exports = {
  getPlaylist,
};
