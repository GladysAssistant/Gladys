/**
 * @description Disconnect Nextcloud Talk
 * @returns {Promise} - Resolve.
 * @example
 * disconnect();
 */
async function disconnect() {
  if (Object.keys(this.bots).length > 0) {
    Promise.all(Object.keys(this.bots).map((token) => this.stopPolling(token)));
  }
}

module.exports = {
  disconnect,
};
