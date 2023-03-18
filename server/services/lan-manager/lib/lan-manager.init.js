/**
 * @description Initialize LAN manager.
 * @example
 * await lanManager.init();
 */
async function init() {
  // Load saved config
  await this.loadConfiguration();
  // Start scanner presence
  this.initPresenceScanner();
}

module.exports = {
  init,
};
