/**
 * @description Disconnect Nextcloud Talk
 * @returns {Promise} - Resolve.
 * @example
 * disconnect();
 */
async function disconnect() {
  Object.keys(this.bots).forEach((token) => this.stopPolling(token));
}

module.exports = {
  disconnect,
};
