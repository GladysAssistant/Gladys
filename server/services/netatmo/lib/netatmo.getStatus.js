/**
 * @description Get Netatmo status.
 * @returns {object} Current Netatmo network status.
 * @example
 * status();
 */
function getStatus() {
  const netatmoStatus = {
    configured: this.configured,
    connected: this.connected,
    status: this.status,
  };
  return netatmoStatus;
}

module.exports = {
  getStatus,
};
