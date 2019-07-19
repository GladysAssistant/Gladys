/**
 * @public
 * @description Play music
 * @param {string} deviceSelector - The selector of the device to control.
 * @param {string} [uri] - The uri to play.
 * @example
 * gladys.music.play('sonos-living-room');
 */
async function play(deviceSelector, uri) {
  await this.callService('play', deviceSelector, [uri]);
}

module.exports = {
  play,
};
