/**
 * @description Scan the network to find IP addresses of Airplay.
 * @example init();
 */
async function init() {
  await this.scan();
}

module.exports = {
  init,
};
