/**
 * @description Restart the mDNS advertisement, reloading the configured hostname.
 * @returns {Promise} Resolve when the advertisement is restarted.
 * @example
 * await mdns.restart();
 */
async function restart() {
  // never started (Gladys web server not up yet), nothing to restart
  if (this.port === null) {
    return;
  }
  await this.stop();
  await this.start(this.port);
}

module.exports = {
  restart,
};
