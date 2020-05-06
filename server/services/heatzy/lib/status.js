/**
 * @description Get Heatzy status.
 * @returns {Object} Current Heatzy network status.
 * @example
 * status();
 */
function status() {
  const heatzyStatus = {
    configured: this.configured,
    connected: this.connected,
  };
  return heatzyStatus;
}

module.exports = {
  status,
};

