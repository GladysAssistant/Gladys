/**
 * @description Disconnect Nextcloud Talk
 * @returns {Promise} - Resolve.
 * @example
 * disconnect();
 */
async function disconnect() {
  Object.keys(this.bots).forEach((userId) => this.stopPolling(userId));
  this.abortController.abort();
}

module.exports = {
  disconnect,
};
