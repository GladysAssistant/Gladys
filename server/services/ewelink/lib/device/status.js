/**
 * @description Get eWeLink status.
 * @returns {object} Current eWeLink network status.
 * @example
 * status();
 */
function status() {
  const eweLinkStatus = {
    configured: this.configured,
    connected: this.connected,
  };
  return eweLinkStatus;
}

module.exports = {
  status,
};
