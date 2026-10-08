const logger = require('../../utils/logger');

/**
 * @description Start-up of the manager: convert the legacy price rows once (section 9).
 * Never blocks the Gladys start: a failure is logged and retried on the next start.
 * @returns {Promise<void>} Resolves when done.
 * @example
 * await energyContract.init();
 */
async function init() {
  try {
    await this.migrateFromEnergyPrice();
  } catch (e) {
    logger.error(`Energy contract migration failed: ${e.message}`);
  }
}

module.exports = { init };
