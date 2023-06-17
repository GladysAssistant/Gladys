/**
 * @description Return list of playlist stored.
 * @returns {Array} List of playlist stored in local folder path.
 * @example
 * getPlaylists();
 */
function getPlaylists() {
  return this.playlistFiles;
}

module.exports = {
  getPlaylists,
};
