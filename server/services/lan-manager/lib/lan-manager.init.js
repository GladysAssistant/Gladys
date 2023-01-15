/**
 * @description Initialize LAN manager.
 * @example
 * await lanManager.init();
 */
async function init() {
  // Run the discovery at startup
  await this.scan();
  // Start scanner presence
  this.initPresenceScanner();
}

module.exports = {
  init,
};
