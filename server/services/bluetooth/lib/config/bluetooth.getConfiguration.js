/**
 * @description Get Bluetooth configuration.
 * @returns {object} - Configuration.
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
