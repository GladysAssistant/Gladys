/**
 * @description Disconnect Nextcloud Talk
 * @returns {Promise} - Resolve.
 * @example
 * disconnect();
 */
async function disconnect() {
  if (this.bots.length > 0) {
    Promise.all(this.bots.map((bot) => bot.stopPolling()));
  }
  this.bot = [];
}

module.exports = {
  disconnect,
};
