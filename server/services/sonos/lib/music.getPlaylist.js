const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @private
 * @description Get playlist
 * @param {Object} device - The device to control.
 * @returns {Promise} Resolve with array of playlist.
 * @example
 * getPlaylist(device);
 */
async function getPlaylist(device) {
  const host = device.external_id.split(':')[1];
  if (!this.devices[host]) {
    throw new NotFoundError('Sonos speaker not found');
  }
  const { items } = await this.devices[host].getFavorites();
  return items.map((playlist) => {
    return {
      name: playlist.title,
      uri: playlist.uri,
    };
  });
}

module.exports = {
  getPlaylist,
};
