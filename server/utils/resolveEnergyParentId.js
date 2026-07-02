const db = require('../models');

/**
 * @description Resolve energy_parent_id to a valid feature id or null.
 * @param {string|null|undefined} energyParentId - Requested parent feature id.
 * @param {object} [options] - Query options.
 * @param {object} [options.transaction] - Sequelize transaction.
 * @returns {Promise<string|null>} Valid parent id or null.
 * @example
 * await resolveEnergyParentId('uuid-of-parent-feature', { transaction });
 */
async function resolveEnergyParentId(energyParentId, { transaction } = {}) {
  if (!energyParentId) {
    return null;
  }

  const parent = await db.DeviceFeature.findByPk(energyParentId, { transaction });
  return parent ? energyParentId : null;
}

module.exports = {
  resolveEnergyParentId,
};
