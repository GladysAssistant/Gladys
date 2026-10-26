const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete a contract by selector. The cost states of its period are removed
 * by the recalculation that follows (a meter without a contract produces no cost state).
 * @param {string} selector - Contract selector.
 * @returns {Promise<void>} Resolves when deleted.
 * @example
 * await destroy('edf-base');
 */
async function destroy(selector) {
  const row = await db.EnergyContract.findOne({ where: { selector } });
  if (row === null) {
    throw new NotFoundError('ENERGY_CONTRACT_NOT_FOUND');
  }
  const contract = row.get({ plain: true });
  await row.destroy();
  this.requestRecalculation(contract, contract.valid_from);
}

module.exports = { destroy };
