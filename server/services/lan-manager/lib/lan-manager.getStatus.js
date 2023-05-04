/**
 * @description Get service status.
 * @returns {object} The service status.
 * @example
 * const status = lanManager.getStatus();
 */
function getStatus() {
  return {
    scanning: this.scanning,
    configured: this.configured,
  };
}

module.exports = {
  getStatus,
};
