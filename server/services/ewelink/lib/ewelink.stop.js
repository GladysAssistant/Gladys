/**
 * @description Stop eWeLink service.
 * @example
 * await this.stop();
 */
async function stop() {
  this.ewelinkWebAPIClient = null;
  this.closeWebSocketClient();
  this.updateStatus({ connected: false });
}

module.exports = {
  stop,
};
