/**
 * @description Get Bluetooth configuration.
 * @returns {Object} - Configuration.
 * @example
 * this.getConfiguration();
 */
function getConfiguration() {
  const { frequency, status } = this.presenceScanner;
  return {
    presenceScanner: { frequency, status },
  };
}

module.exports = {
  getConfiguration,
};
