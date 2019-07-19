const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @private
 * @description Play music
 * @param {Object} device - The device to control.
 * @param {string} [uri] - Uri of the song.
 * @example
 * play(device);
 */
async function play(device, uri) {
  const host = device.external_id.split(':')[1];
  if (!this.devices[host]) {
    throw new NotFoundError('Sonos speaker not found');
  }
  await this.devices[host].play(uri);
}

module.exports = {
  play,
};
