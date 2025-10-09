const db = require('../../models');

/**
 * @description Delete an energy price by selector.
 * @param {string} selector - Selector of the energy price.
 * @returns {Promise<void>} Resolves when deletion is complete.
 * @example
 * await destroy('base-consumption-2025-01-01-any');
 */
async function destroy(selector) {
  await db.EnergyPrice.destroy({ where: { selector } });
}

module.exports = { destroy };
