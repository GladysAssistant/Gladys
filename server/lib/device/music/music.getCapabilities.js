/**
 * @description The on-demand operations the player's integration declared
 * (capabilities/music.md, section 4.1), read from the stored manifest: no
 * command, no connection required.
 * @param {string} selector - The device selector.
 * @returns {object} `{ browse, search, queue, append }`.
 * @example
 * const capabilities = gladys.device.music.getCapabilities('kitchen-speaker');
 */
function getCapabilities(selector) {
  const { music } = this.getPlayer(selector);
  return music.getCapabilities();
}

module.exports = {
  getCapabilities,
};
