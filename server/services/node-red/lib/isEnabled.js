/**
 * @description Checks if Node-red is ready to use.
 * @returns {boolean} Is the Node-red environment ready to use?
 * @example
 * nodeRed.isEnabled();
 */
function isEnabled() {
  return this.nodeRedRunning;
}

module.exports = {
  isEnabled,
};
