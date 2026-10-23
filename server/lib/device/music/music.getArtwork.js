/**
 * @description The artwork of a player behind a key (capabilities/music.md,
 * section 3): served by the integration, validated and cached by the core.
 * @param {string} selector - The device selector.
 * @param {string} key - The artwork key.
 * @returns {Promise<string>} Resolve with the image as a data URI.
 * @example
 * const image = await gladys.device.music.getArtwork('kitchen-speaker', 'art-3f9a2c1b7e4d');
 */
async function getArtwork(selector, key) {
  const { device, music } = this.getPlayer(selector);
  return music.getArtwork(device, key);
}

module.exports = {
  getArtwork,
};
