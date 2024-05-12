/**
 * @description Set debug mode param.
 * @param {boolean} debugMode - Debug Mode.
 * @returns {boolean} Return current debug mode.
 * @example setDebugMode(true);
 */
function setDebugMode(debugMode) {
  this.debugMode = debugMode;
  if (debugMode) {
    clearTimeout(this.debugModeTimeout);
    // disable debug mode after xx seconds
    this.debugModeTimeout = setTimeout(() => {
      this.setDebugMode(false);
    }, this.debugModeTimeout);
  }
  return debugMode;
}

module.exports = {
  setDebugMode,
};
