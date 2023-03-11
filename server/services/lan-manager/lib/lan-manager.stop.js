/**
 * @description Stop LAN manager.
 * @example
 * lanManager.stop();
 */
function stop() {
  this.scanning = false;

  if (this.scanner) {
    this.scanner.cancelScan();
    this.scanner.removeAllListeners();
  }

  this.scanner = null;
}

module.exports = {
  stop,
};
