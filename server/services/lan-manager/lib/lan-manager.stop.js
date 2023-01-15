/**
 * @description Stop LAN manager.
 * @example
 * lanManager.stop();
 */
function stop() {
  this.discoveredDevices = [];
  this.scanning = false;
}

module.exports = {
  stop,
};
