const logger = require('../../utils/logger');

/**
 * @description Start-up of the manager: convert the legacy price rows once (section 9), then
 * repair the energy hierarchy (docs/specs/energy-hierarchy.md, section C.3). Never blocks the
 * Gladys start: a failure is logged and retried on the next start.
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
  try {
    await this.repairHierarchy();
  } catch (e) {
    logger.error(`Energy hierarchy repair failed: ${e.message}`);
  }
}

module.exports = { init };
