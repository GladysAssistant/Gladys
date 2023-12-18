/**
 * @description This will init the Sonos library.
 * @example sonos.init();
 */
async function init() {
  const { SonosManager } = this.sonosLib;
  this.manager = new SonosManager();
  await this.scan();
}

module.exports = {
  init,
};
