const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update an energy price by selector.
 * @param {string} selector - Selector of the energy price.
 * @param {object} data - Fields to update.
 * @returns {Promise<object>} Updated row.
 * @example
 * await update('base-consumption-2025-01-01-any', { price: 21 });
 */
async function update(selector, data) {
  const row = await db.EnergyPrice.findOne({ where: { selector } });
  if (!row) {
    throw new NotFoundError('ENERGY_PRICE_NOT_FOUND');
  }
  await row.update(data);
  return row.get({ plain: true });
}

module.exports = { update };
