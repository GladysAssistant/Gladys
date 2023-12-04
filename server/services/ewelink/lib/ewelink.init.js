/**
 * @description Initialize eWeLink service.
 * @example
 * await this.init();
 */
async function init() {
  await this.upgrade();
  await this.loadConfiguration();
}

module.exports = {
  init,
};
