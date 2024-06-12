/**
 * @description Scan the network to find IP addresses of Google Cast.
 * @example init();
 */
async function init() {
  await this.scan();
}

module.exports = {
  init,
};
