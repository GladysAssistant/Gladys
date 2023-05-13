const { ADAPTERS } = require('../adapters');

/**
 * @description Get managed adapters.
 * @returns {Array} Managed adapters.
 * @example
 * const adapters = this.getManagedAdapters();
 */
function getManagedAdapters() {
  return ADAPTERS;
}

module.exports = {
  getManagedAdapters,
};
