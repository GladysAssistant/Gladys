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
  // two hostname changes in a row must not race: without this, both calls could
  // reach start() and leave a second advertiser running on the network
  if (this.restartPromise !== null) {
    await this.restartPromise;
    return;
  }
  const { port } = this;
  this.restartPromise = (async () => {
    await this.stop();
    await this.start(port);
  })();
  try {
    await this.restartPromise;
  } finally {
    this.restartPromise = null;
  }
}

module.exports = {
  restart,
};
