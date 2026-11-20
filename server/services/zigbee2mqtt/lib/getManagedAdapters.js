const { DISPLAYED_ADAPTERS } = require('../adapters/display');

/**
 * @description Get managed adapters, each with how the setup page shows it (brand, commercial name, photo...).
 * @returns {Array} Managed adapters.
 * @example
 * const adapters = this.getManagedAdapters();
 */
function getManagedAdapters() {
  return DISPLAYED_ADAPTERS;
}

module.exports = {
  getManagedAdapters,
};
