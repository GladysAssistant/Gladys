/**
 * @description Get LANManager configuration.
 * @returns {object} - Configuration.
 * @example
 * this.getConfiguration();
 */
function getConfiguration() {
  const { frequency, status } = this.presenceScanner;
  return {
    presenceScanner: { frequency, status },
    ipMasks: this.ipMasks,
  };
}

module.exports = {
  getConfiguration,
};
